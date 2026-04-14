import sys, os, subprocess, socket, struct, re, time, threading, json
import ipaddress, concurrent.futures
from datetime import datetime
from vuln_engine import VulnEngine

class ScannerCore:
    def __init__(self):
        self.devices = {}
        self.is_scanning = False
        self.stop_event = threading.Event()
        self.vuln_engine = VulnEngine()

    def get_vendor(self, mac):
        if not mac or mac == "00:00:00:00:00:00": return "Unknown"
        # Em um cenário real, usaríamos uma base OUI. Aqui simulamos alguns:
        prefix = mac.replace(":", "")[:6].upper()
        vendors = {"000C29": "VMware", "080027": "VirtualBox", "B827EB": "Raspberry Pi"}
        return vendors.get(prefix, "Unknown Device")

    def scan_port(self, ip, port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.3) # Timeout mais agressivo para velocidade
                if s.connect_ex((ip, port)) == 0:
                    return port
        except: pass
        return None

    def get_hostname(self, ip):
        try:
            return socket.gethostbyaddr(ip)[0]
        except:
            return "N/A"

    def discover_hosts(self, network):
        hosts = []
        try:
            # Tenta nmap primeiro
            cmd = ["nmap", "-sn", network]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            for line in proc.stdout.splitlines():
                if "Nmap scan report for" in line:
                    parts = line.split()
                    ip = parts[-1].strip("()")
                    hosts.append({"ip": ip, "mac": "00:00:00:00:00:00", "hostname": self.get_hostname(ip)})
        except:
            pass
        return hosts

    def full_scan(self, network):
        self.is_scanning = True
        print(json.dumps({"type": "status", "msg": f"Iniciando scan e análise de vulnerabilidades em {network}"}))
        
        hosts = self.discover_hosts(network)
        print(json.dumps({"type": "progress", "current": 0, "total": len(hosts)}))

        for idx, host in enumerate(hosts):
            ip = host["ip"]
            ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 443, 445, 3306, 3389, 5432, 6379, 8080]
            open_ports = []
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(self.scan_port, ip, p) for p in ports]
                for future in concurrent.futures.as_completed(futures):
                    p = future.result()
                    if p: open_ports.append(p)

            # Análise de Vulnerabilidades
            findings = self.vuln_engine.analyze(ip, open_ports, host.get("vendor", ""))
            risk_score = self.vuln_engine.get_risk_score(findings)

            device = {
                "ip": ip,
                "mac": host["mac"],
                "hostname": host["hostname"],
                "vendor": self.get_vendor(host["mac"]),
                "ports": open_ports,
                "findings": findings,
                "risk_score": risk_score,
                "last_seen": datetime.now().isoformat(),
                "status": "online"
            }
            
            self.devices[ip] = device
            print(json.dumps({"type": "device", "data": device}))
            print(json.dumps({"type": "progress", "current": idx + 1, "total": len(hosts)}))

        self.is_scanning = False
        print(json.dumps({"type": "status", "msg": "Scan e análise concluídos"}))

if __name__ == "__main__":
    # Modo CLI para o Node.js chamar
    core = ScannerCore()
    if len(sys.argv) > 1:
        target_net = sys.argv[1]
        core.full_scan(target_net)
    else:
        # Padrão se não informado
        core.full_scan("192.168.1.0/24")
