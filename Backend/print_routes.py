from app import app_server
for rule in sorted(app_server.url_map.iter_rules(), key=lambda r: (r.rule, r.endpoint)):
    methods = ','.join(sorted(rule.methods))
    print(f"{rule.rule:40} -> {rule.endpoint:40} [{methods}]")
