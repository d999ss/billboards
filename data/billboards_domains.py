#!/usr/bin/env python3
"""Check availability of <state>-billboards.com for all 50 US states via whois."""
import json, subprocess, concurrent.futures

STATES = [
    "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
    "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
    "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
    "minnesota","mississippi","missouri","montana","nebraska","nevada",
    "new-hampshire","new-jersey","new-mexico","new-york","north-carolina",
    "north-dakota","ohio","oklahoma","oregon","pennsylvania","rhode-island",
    "south-carolina","south-dakota","tennessee","texas","utah","vermont",
    "virginia","washington","west-virginia","wisconsin","wyoming",
]

def status(state):
    d = f"{state}-billboards.com"
    try:
        out = subprocess.run(["whois", d], capture_output=True, text=True,
                              timeout=30).stdout.lower()
        if "no match for" in out or "not found" in out:
            return d, "AVAILABLE"
        if "domain name:" in out or "registrar:" in out:
            return d, "TAKEN"
        return d, "UNKNOWN"
    except Exception as e:
        return d, f"ERROR {e}"

def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        results = sorted(ex.map(status, STATES))
    for d, st in results:
        print(f"{st:10} {d}")
    avail = [d for d, st in results if st == "AVAILABLE"]
    print(f"\n=== {len(avail)}/{len(results)} AVAILABLE ===")
    for d in avail:
        print(d)
    with open("/Users/donnysmith/billboards_domains.json", "w") as f:
        json.dump([{"domain": d, "status": st} for d, st in results], f, indent=2)

if __name__ == "__main__":
    main()
