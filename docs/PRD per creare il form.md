<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# fai un documento sintetico PRD per creare il form frontend con queste funzionalità

**Product Requirements Document (PRD) - Form Frontend Contatti Formula Finance**

***

**Obiettivo**
Realizzare il frontend per la gestione dei contatti sulla piattaforma Formula Finance, con form per inserimento, modifica e visualizzazione delle relazioni tra account (clienti, rivenditori, ecc).

***

**Funzionalità Principali**

- **Creazione Nuovo Contatto**
    - Campi anagrafici:
        - Ragione Sociale
        - Partita IVA
        - Codice Fiscale
        - Tipologia (cliente, intermediario, rivenditore, potenziale)
        - Tipo Utente (professionista, società, PA)
        - Stato (attivo, disabilitato)
    - Riferimenti:
        - Email principale
        - PEC Email
        - Telefono
        - Telefono alternativo
    - Indirizzo:
        - Via, Città, CAP, Provincia
    - Collegamento parent associato (ricerca e selezione di altro contatto)
    - Note aggiuntive
- **Gestione Account Collegati**
    - Visualizzazione e gestione multipli account associati al cliente
    - Possibilità di aggiungere nuovi account al contatto (cliente multiazienda)
- **Gestione Rivenditori e Clienti Collegati**
    - Per gli account di tipo rivenditore, visualizzazione tabella clienti associati
    - Possibilità di creare/collegare nuovi clienti al rivenditore
- **Relazioni**
    - Visualizzazione collegamenti tra contatti (parent, figli, associazioni)
    - Gestione tramite UI delle relazioni (aggiungi/rimuovi cliente a rivenditore, collega account, ecc.)

***

**UI/UX**

- Menu a tendina chiari per tipologia, tipo utente e stato
- Ricerca assistita per collegamento parent associato e clienti/rivenditori
- Tabelle responsive per visualizzazione account e clienti associati
- Sezione note e riferimenti
- Validazione dati obbligatori e formato

***

**User Stories**

- Come amministratore, posso creare e modificare un contatto e assegnargli più account/opzioni
- Come rivenditore, posso vedere la lista dei miei clienti collegati e aggiungerne nuovi tramite il form

***

**Tecnologie Suggerite**

- Framework frontend: React, Vue o Flutter Web
- API REST per operazioni CRUD su contatti/account/relazioni

***

**Nota finale**
La soluzione deve essere scalabile per future espansioni (es. supporto a gruppi, gestione documenti allegati, permessi granulari).

---
<span style="display:none">[^1]</span>

<div align="center">⁂</div>

[^1]: https://app.crexpert.it/app/admin/contacts

