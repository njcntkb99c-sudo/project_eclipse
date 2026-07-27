# Project Eclipse — v0.7 Cloudbound

## Novità

- Registrazione tramite email e password
- Accesso allo stesso account da più dispositivi
- Conferma email
- Recupero password
- Salvataggio manuale nel cloud
- Download dei progressi cloud
- Salvataggio locale ancora disponibile per gli ospiti
- Sincronizzazione di run, Essenza, record, Reliquie, Altare, storia e impostazioni
- Protezione dei salvataggi con Supabase Row Level Security

## File aggiunti

- `cloud-config.js`
- `cloud-save.js`
- `supabase-setup.sql`
- `CONFIGURAZIONE-CLOUD.md`

## Prima della pubblicazione

Segui `CONFIGURAZIONE-CLOUD.md` e inserisci Project URL e chiave pubblica nel file `cloud-config.js`.

Non inserire mai la chiave Supabase `service_role`.
