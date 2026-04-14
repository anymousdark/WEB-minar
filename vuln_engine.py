import re

class VulnEngine:
    def __init__(self):
        self.VULN_DB = {
            21: {
                "severity": "CRITICAL", 
                "title": "FTP - Unencrypted", 
                "desc": "Credentials sent in clear text. Risk of sniffing and brute-force.",
                "cve": "N/A",
                "link": "https://nvd.nist.gov/vuln-metrics/cvss"
            },
            22: {
                "severity": "MEDIUM", 
                "title": "SSH Exposed", 
                "desc": "Potential for brute-force attacks if not properly secured.",
                "cve": "N/A",
                "link": "https://www.ssh.com/academy/ssh/security"
            },
            23: {
                "severity": "CRITICAL", 
                "title": "Telnet - Obsolete", 
                "desc": "Extremely insecure protocol. Everything is sent in clear text.",
                "cve": "N/A",
                "link": "https://csrc.nist.gov/glossary/term/telnet"
            },
            80: {
                "severity": "MEDIUM", 
                "title": "HTTP - Unencrypted", 
                "desc": "Traffic is not encrypted. Risk of MITM attacks.",
                "cve": "N/A",
                "link": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"
            },
            445: {
                "severity": "CRITICAL", 
                "title": "SMB - EternalBlue Risk", 
                "desc": "Potential for RCE attacks if patches are missing (MS17-010).",
                "cve": "CVE-2017-0144",
                "link": "https://nvd.nist.gov/vuln/detail/CVE-2017-0144"
            },
            3306: {
                "severity": "HIGH", 
                "title": "MySQL Exposed", 
                "desc": "Database exposed to the network. Risk of data breach.",
                "cve": "N/A",
                "link": "https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html"
            },
            3389: {
                "severity": "HIGH", 
                "title": "RDP - BlueKeep Risk", 
                "desc": "Remote Desktop exposed. Potential for RCE (CVE-2019-0708).",
                "cve": "CVE-2019-0708",
                "link": "https://nvd.nist.gov/vuln/detail/CVE-2019-0708"
            },
            6379: {
                "severity": "CRITICAL", 
                "title": "Redis No Auth", 
                "desc": "Redis often deployed without password. Risk of remote command execution.",
                "cve": "CVE-2022-0543",
                "link": "https://nvd.nist.gov/vuln/detail/CVE-2022-0543"
            }
        }

    def analyze(self, ip, ports, vendor=""):
        findings = []
        for port in ports:
            if port in self.VULN_DB:
                finding = self.VULN_DB[port].copy()
                finding["port"] = port
                findings.append(finding)
        
        # Análise baseada em fabricante (exemplo)
        if "hikvision" in vendor.lower() or "dahua" in vendor.lower():
            findings.append({
                "severity": "HIGH",
                "title": "IP Camera Security",
                "desc": "IoT devices often have default credentials or outdated firmware.",
                "port": None,
                "cve": "Multiple",
                "link": "https://www.cisa.gov/news-events/alerts/2021/09/21/hikvision-releases-security-advisory"
            })
            
        return findings

    def get_risk_score(self, findings):
        weights = {"CRITICAL": 40, "HIGH": 25, "MEDIUM": 10, "LOW": 5}
        score = sum(weights.get(f["severity"], 0) for f in findings)
        return min(score, 100)
