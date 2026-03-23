# Mail Setup Guide (Backend, Table-Change Based)

This project uses centralized mail hooks from Sequelize models.

## Trigger Source

Mail triggers only when table row changes:
- `afterCreate`
- `afterUpdate`
- `afterDestroy`

If no table change, no mail.

Main file:
- `API/utils/globalMail.js`

## End-to-End Flow (Forget OTP Example)

1. Frontend calls `POST /v1/admin-auth/forget-password`
2. Controller/service creates OTP row in `Otps`
3. `Otp` model `afterCreate` hook runs
4. Mail engine finds matching template by:
   - `module` (`Otp`)
   - `operation` (`create`)
   - `triggerOn` (`always/field_change/custom_condition/...`)
5. Placeholders are replaced
6. Mail is sent in background (non-blocking)

## Template Matching Rules

Template table: `EmailTemplates`

- `module`:
  - exact model name
  - `*` or `all` as wildcard
- `operation`:
  - exact `create/update/delete`
  - empty/null = any operation
- best score wins:
  - exact model > wildcard model
  - exact operation > any

## Trigger Conditions (`triggerOn`)

- `always`
  - always run when module/operation matches

- `status_change`
  - update only
  - runs when `status` changed

- `field_change`
  - update: runs when watched fields changed
  - create/delete: runs if watched field has value

- `custom_condition`
  - uses `conditionRules` JSON
  - operators:
    - `eq`
    - `neq`
    - `includes`
    - `changed`
    - `changed_to`

## Placeholder Support

Supported in subject/body:
- `{{field}}`
- `##field##`

Main resolver:
- `replacePlaceholders()` in `API/utils/globalMail.js`

## Attachments

Attachment field can contain:
- file id/object (resolved by `File` model)
- direct URL/path string

Useful for cases like `passfile` path.

## Background / Performance

Mail dispatch runs in background via `setImmediate`.
API response should not be blocked by SMTP send delay.

## Files You Edit for Backend Changes

- matching / dispatch / condition logic:
  - `API/utils/globalMail.js`
- template payload normalization:
  - `API/services/v1/emailTemplate/normalizePayload.js`
- template schema:
  - `API/models/emailtemplate.js`
- table schema changes:
  - `API/migrations/*.js`

## Recommended Rule Pattern

1. Specific business rules first (exact model + exact condition)
2. Wildcard `*` rules only as fallback
3. Test in `mail=0` (log only), then switch to `mail=1`
