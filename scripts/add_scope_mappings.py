#!/usr/bin/env python3
"""Add Authentik default scope mappings to trailhead-oauth2 provider"""
from authentik.providers.oauth2.models import OAuth2Provider, ScopeMapping

provider = OAuth2Provider.objects.get(name="trailhead-oauth2")
print(f"Provider: {provider.name}")
print(f"Current mappings: {provider.property_mappings.count()}")

# Get all default Authentik scope mappings
default_mappings = ScopeMapping.objects.filter(
    managed__startswith="goauthentik.io/providers/oauth2/scope-"
)

print(f"\nFound {default_mappings.count()} default scope mappings")

for mapping in default_mappings:
    if mapping not in provider.property_mappings.all():
        provider.property_mappings.add(mapping)
        print(f"  ✓ Added: {mapping.name} (scope: {mapping.scope_name})")
    else:
        print(f"  - Already has: {mapping.name} (scope: {mapping.scope_name})")

provider.save()
print(f"\n✅ Provider now has {provider.property_mappings.count()} property mappings")
