# Configurare accesso email e salvataggio cloud

La v0.7 continua a funzionare anche senza account usando il salvataggio locale.
Per attivare account e cloud devi configurare Supabase.

## 1. Crea il progetto

1. Vai su Supabase e crea un account.
2. Crea un nuovo progetto.
3. Attendi che il progetto sia pronto.

## 2. Crea la tabella dei salvataggi

1. Nel progetto apri **SQL Editor**.
2. Crea una nuova query.
3. Copia tutto il contenuto di `supabase-setup.sql`.
4. Premi **Run**.

La tabella usa Row Level Security: ogni giocatore può leggere e modificare solamente il proprio salvataggio.

## 3. Copia URL e chiave pubblica

Nel pannello Supabase apri le impostazioni API del progetto e copia:

- Project URL
- Publishable key oppure anon public key

Apri `cloud-config.js` e sostituisci:

```js
supabaseUrl: "INCOLLA_QUI_PROJECT_URL",
supabaseAnonKey: "INCOLLA_QUI_PUBLISHABLE_ANON_KEY"
```

Non usare mai la chiave `service_role`.

## 4. Configura l’indirizzo del gioco

Nelle impostazioni Authentication di Supabase:

- imposta come Site URL l’indirizzo GitHub Pages del gioco;
- aggiungi lo stesso indirizzo tra i Redirect URLs.

Esempio:

```text
https://tuo-utente.github.io/project_eclipse/
```

## 5. Carica i file su GitHub

Carica anche i nuovi file:

- `cloud-config.js`
- `cloud-save.js`

Oltre ai file già esistenti.

## Funzionamento

Il giocatore può:

- registrarsi con email e password;
- confermare l’email;
- accedere da qualsiasi dispositivo;
- caricare manualmente i progressi nel cloud;
- scaricare i progressi cloud su un altro dispositivo;
- reimpostare la password;
- continuare a giocare come ospite.

Il salvataggio cloud comprende run, Essenza, Altare dell’Eredità, record, Reliquie, impostazioni e storia.
