# API Field Mapping - Formula Finance vs Backend

## Contact Creation Endpoint Comparison

| Formula Finance Field | Backend API Field | Status | Notes |
|----------------------|-------------------|---------|-------|
| **STEP 1: ANAGRAFICA** | | | |
| `ragioneSociale` | `business_name` | ✅ Match | Both required strings |
| `partitaIva` | `vat_number` | ⚠️ Name diff | Both strings, API allows null |
| `codiceFiscale` | `tax_code` | ⚠️ Name diff | Both optional strings |
| `tipoUtente` | `contact_type` | ⚠️ Values diff | See mapping table below |
| `soggetto` | ❌ **MISSING** | 🔴 Missing | Frontend has: professionista/societa/pa |
| `stato` | `status` | ⚠️ Values diff | See mapping table below |
| **STEP 2: RIFERIMENTI** | | | |
| `email` | `email` | ✅ Match | Both required, email validation |
| `pecEmail` | `pec_email` | ⚠️ Name diff | Both optional email strings |
| `telefono` | `phone` | ✅ Match | Both optional strings |
| `telefonoAlt` | `phone_alt` | ⚠️ Name diff | Both optional strings |
| **STEP 3: INDIRIZZO** | | | |
| `via` | `address` | ⚠️ Name diff | Both optional strings |
| `citta` | `city` | ✅ Match | Both optional strings |
| `cap` | `postal_code` | ⚠️ Name diff | Both optional strings |
| `provincia` | `province` | ✅ Match | Both optional strings |
| ❌ **MISSING** | `country` | 🔴 Missing | Backend required, default "IT" |
| **STEP 4: RELAZIONI** | | | |
| `parentId` | `parent_contact_id` | ⚠️ Name diff | Both optional integers |
| `noteAggiuntive` | `notes` | ⚠️ Name diff | Both optional strings |
| **STEP 5: LICENZE** | | | |
| `licenze.moduli[]` | ❌ **NOT IN CONTACT API** | 🔴 Separate | Use `/api/v1/licenses/contact/{contact_id}` |
| **BACKEND ONLY** | | | |
| ❌ **MISSING** | `subject_category` | 🔴 Missing | Backend optional string |

## Value Mapping Tables

### Contact Type Mapping
| Formula Finance (`tipoUtente`) | Backend (`contact_type`) | Status |
|-------------------------------|-------------------------|---------|
| `cliente` | Need backend value | 🔴 Backend missing |
| `rivenditore` | Need backend value | 🔴 Backend missing |
| `intermediario` | Need backend value | 🔴 Backend missing |
| `potenziale` | Need backend value | 🔴 Backend missing |
| - | `client` (default) | 🔴 Frontend missing |

### Status Mapping
| Formula Finance (`stato`) | Backend (`status`) | Status |
|---------------------------|-------------------|---------|
| `attivo` | `active` (default) | ⚠️ Needs mapping |
| `disabilitato` | Need backend value | 🔴 Backend missing |

## Required Backend Changes

### 1. Add Missing Fields to Backend API
```json
{
  "soggetto": "string | null",  // professionista, societa, pa
  "subject_category": "string | null"  // Keep existing field
}
```

### 2. Extend Contact Type Enum
Backend needs to support:
- `cliente` (client)
- `rivenditore` (reseller)
- `intermediario` (intermediary)
- `potenziale` (potential)

### 3. Extend Status Enum
Backend needs to support:
- `attivo` (active)
- `disabilitato` (disabled/inactive)

### 4. Add Country Field to Frontend
Frontend form needs:
- `paese` field mapping to `country` (default: "IT")

## License System Integration

The license system (`licenze.moduli[]`) should be handled separately:

1. **First**: Create contact via `/api/v1/contacts`
2. **Then**: For each module in `licenze.moduli[]`:
   - Call `/api/v1/licenses/contact/{contact_id}`
   - Map frontend fields to license API structure

## Summary

**🔴 Critical Issues (5):**
- Missing `soggetto` field in backend
- Missing contact type values in backend
- Missing status values in backend
- Missing `paese`/`country` in frontend
- License system needs separate API calls

**⚠️ Mapping Issues (7):**
- Field name differences need mapping layer
- Value format differences need transformation

**✅ Compatible (4):**
- Core fields work as-is with proper mapping

## Recommendation
**Update the backend API** to match Formula Finance's comprehensive data model, as the frontend captures more complete business information than the current backend supports.