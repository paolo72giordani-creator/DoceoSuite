export const DILEMMA_TEMPLATES = [
  {
    id: 'template-varennes-completo',
    title: 'La Fuga di Varennes (1791)',
    description: 'Guida le decisioni di Luigi XVI durante la Rivoluzione Francese. Ogni scelta porta a conseguenze storiche e finali differenti.',
    icon: '📜',
    category: 'Storia',
    nodes: [
      {
        id: 'node-v1',
        title: '1. Il Dilemma del Re a Parigi',
        content: 'Giugno 1791. Il palazzo delle Tuileries è piantonato dalla Guardia Nazionale. L\'Assemblea Costituente limita progressivamente il tuo potere. I tuoi consiglieri sono divisi: rimanere a Parigi accettando la costituzione o fuggire verso i territori leali a Est per riorganizzare l\'esercito?',
        is_root: true,
        choices: [
          { text: 'Organizza la fuga notturna travestiti', feedback: 'Vi mettete in viaggio in carrozza in gran segreto nella notte tra il 20 e il 21 giugno.', next_title: '2. Il Ritardo a Varennes' },
          { text: 'Rimani a Parigi e giura sulla Costituzione', feedback: 'Accetti il ruolo di sovrano costituzionale tentando la via della diplomazia interna.', next_title: '3. La Trappola delle Tuileries' }
        ]
      },
      {
        id: 'node-v2',
        title: '2. Il Ritardo a Varennes',
        content: 'La pesante carrozza reale accumula oltre tre ore di ritardo. A Sainte-Menehould, il mastro di posta Jean-Baptiste Drouet vi riconosce dal profilo impresso sui luigi d\'oro. Arrivate a Varennes a notte fonda, ma la strada è sbarrata.',
        is_root: false,
        choices: [
          { text: 'Forza subito il posto di blocco alla cittadella', feedback: 'Ordini alla scorta di aprire il fuoco per rompere l\'assedio prima dell\'arrivo dei rinforzi.', next_title: '4. Scontro Fuoco e Arresto' },
          { text: 'Chiedi asilo al sindaco locale sperando nella lealtà', feedback: 'Il sindaco ti accoglie in casa propria, ma prende tempo mentre allerta segretamente la Guardia Nazionale.', next_title: '5. La Prigionia e il Processo' }
        ]
      },
      {
        id: 'node-v3',
        title: '3. La Trappola delle Tuileries',
        content: 'Hai giurato sulla Costituzione. Tuttavia, le potenze straniere (Austria e Prussia) minacciano di invadere la Francia. I Giacobini ti accusano di complicità con il nemico e l\'Assemblea ti chiede di approvare decreti severi contro i refrattari.',
        is_root: false,
        choices: [
          { text: 'Usa il diritto di veto sulle leggi dell\'Assemblea', feedback: 'Il tuo veto scatena l\'ira dei sanculotti e dimostra il tuo ostacolo alla Rivoluzione.', next_title: '5. La Prigionia e il Processo' },
          { text: 'Accetta i decreti e dichiara guerra all\'Austria', feedback: 'Speri che la guerra compatti la nazione o che una sconfitta ripristini il tuo potere.', next_title: '6. Il Re della Repubblica' }
        ]
      },
      {
        id: 'node-v4',
        title: '4. Scontro Fuoco e Arresto',
        content: 'Scoppia una violenta sparatoria nella notte. Sopraffatti dal numero, venite catturati. Il tentativo di fuga armata elimina ogni residua simpatia popolare: venite ricondotti a Parigi da prigionieri scortati da una folla ostile.',
        is_root: false,
        choices: [
          { text: 'Sottomettiti al giudizio dell\'Assemblea', feedback: 'Accetti il destino giudiziario.', next_title: '5. La Prigionia e il Processo' },
          { text: 'Invita le truppe lealiste di Bouillé all\'attacco', feedback: 'Tentativo estremo che scatena la guerra civile.', next_title: '7. Guerra Civile e Fuga all\'Estero' }
        ]
      },
      {
        id: 'node-v5',
        title: '5. La Prigionia e il Processo',
        content: 'Il tentativo di fuga e l\'opposizione ai decreti vengono interpretati come alto tradimento verso la patria. Venite trasferiti nella prigione del Tempio. Nel gennaio 1793 la condanna a morte viene eseguita tramite ghigliottina.',
        is_root: false,
        choices: [] // FINALE 1
      },
      {
        id: 'node-v6',
        title: '6. Il Re della Repubblica',
        content: 'Piegandoti completamente alla volontà della Costituente e sostenendo lo sforzo bellico, eviti la condanna per tradimento. Mantieni il titolo formale di sovrano all\'interno di una monarchia costituzionale stabile.',
        is_root: false,
        choices: [] // FINALE 2
      },
      {
        id: 'node-v7',
        title: '7. Guerra Civile e Fuga all\'Estero',
        content: 'L\'intervento delle truppe lealiste ti permette di varcare il confine. Da qui organizzi un esercito di controrivoluzionari in esilio, scatenando una sanguinosa guerra civile.',
        is_root: false,
        choices: [] // FINALE 3
      }
    ]
  },
  {
    id: 'template-ia-etica-completo',
    title: 'L\'Algoritmo della Salute (Etica & IA)',
    description: 'Un dilemma etico moderno: programma la logica d\'accesso a un pronto soccorso durante una grave crisi sanitaria.',
    icon: '🤖',
    category: 'Educazione Civica',
    nodes: [
      {
        id: 'node-a1',
        title: '1. Il Criterio Primario',
        content: 'Sei il responsabile del comitato bioetico di un grande ospedale. Un nuovo virus ha saturato le terapie intensive. Dovete programmare il triage automatico gestito dall\'IA per l\'assegnazione degli ultimi ventilatori polmonari rimasti.',
        is_root: true,
        choices: [
          { text: 'Privilegia la speranza di vita residua (Anni di vita salvabili)', feedback: 'L\'algoritmo favorirà i pazienti più giovani e senza patologie pregresse.', next_title: '2. L\'Impatto sui Pazienti Anziani' },
          { text: 'Privilegia l\'ordine di arrivo rigido (Principio di parità)', feedback: 'L\'algoritmo ignorerà età e quadro clinico favorendo il tempo di attesa.', next_title: '3. Il Collasso della Terapia Intensiva' }
        ]
      },
      {
        id: 'node-a2',
        title: '2. L\'Impatto sui Pazienti Anziani',
        content: 'L\'algoritmo esclude quasi del tutto gli over 70 dal supporto avanzato. I familiari dei pazienti protestano vivacemente e la stampa vi accusa di discriminazione basata sull\'età ed eugenetica digitale.',
        is_root: false,
        choices: [
          { text: 'Metti un bonus per i lavoratori essenziali (Medici, Insegnanti, ecc.)', feedback: 'Introduci un criterio di utilità sociale immediata.', next_title: '4. La Rivolta delle Categorie' },
          { text: 'Mantieni il criterio scientifico ed elargisci cure palliative', feedback: 'Difendi la scelta tecnica basata sulle metriche di sopravvivenza.', next_title: '5. Modello Utilitarista' }
        ]
      },
      {
        id: 'node-a3',
        title: '3. Il Collasso della Terapia Intensiva',
        content: 'I ventilatori vengono occupati da pazienti con probabilità di sopravvivenza minime solo perché arrivati prima. I tassi di mortalità ospedaliera impennano e le risorse si esauriscono rapidamente.',
        is_root: false,
        choices: [
          { text: 'Intervieni manualmente e disattiva l\'IA', feedback: 'I medici riprendono decisioni arbitrarie e sotto stress estreme.', next_title: '6. Gestione Umana sotto Pressione' },
          { text: 'Riprogramma l\'IA su basi di efficienza clinica immediata', feedback: 'Cambi criterio a crisi in corso scatenando controversie legali.', next_title: '5. Modello Utilitarista' }
        ]
      },
      {
        id: 'node-a4',
        title: '4. La Rivolta delle Categorie',
        content: 'Assegnare un valore sociale alle professioni crea spaccature etiche gravissime nella società. Si apre una causa collettiva contro l\'ospedale per violazione dei diritti fondamentali dell\'uomo.',
        is_root: false,
        choices: []
      },
      {
        id: 'node-a5',
        title: '5. Modello Utilitarista',
        content: 'L\'ospedale ottiene il massimo tasso percentuale di vite salvate, ma a prezzo di un duro impatto psicologico sui sanitari e di una grave frattura di fiducia con la popolazione anziana.',
        is_root: false,
        choices: []
      },
      {
        id: 'node-a6',
        title: '6. Gestione Umana sotto Pressione',
        content: 'Il personale medico assume direttamente il peso etico di ogni singola scelta, sollevando la tecnologia dalla decisione ma aumentando esponenzialmente il burn-out del personale.',
        is_root: false,
        choices: []
      }
    ]
  },
  {
    id: 'template-amleto-letteratura',
    title: 'Il Bivio di Amleto (Letteratura & Filosofia)',
    description: 'Vestite i panni del principe Amleto nel castello di Elsinore: vendetta immediata, finzione della follia o ricerca della verità?',
    icon: '🎭',
    category: 'Letteratura',
    nodes: [
      {
        id: 'node-h1',
        title: '1. Lo Spettro sulle Mura di Elsinore',
        content: 'Sei il principe Amleto. Il fantasma di tuo padre appare sulle mura del castello rivelando di essere stato avvelenato dal fratello Claudio, ora salito al trono e sposo di tua madre Gertrude. Lo spettro chiede vendetta. Come intendi agire?',
        is_root: true,
        choices: [
          { text: 'Fingi la follia per osservare Claudio senza destare sospetti', feedback: 'Adotti un comportamento eccentrico per disorientare la corte.', next_title: '2. La Maschera della Follia' },
          { text: 'Sguaina la spada e sfida subito Claudio in duello pubblico', feedback: 'Agisci d\'impulso affrontando direttamente il re usurpatore.', next_title: '3. La Rivolta della Corte' }
        ]
      },
      {
        id: 'node-h2',
        title: '2. La Maschera della Follia',
        content: 'La tua presunta follia preoccupa il re e la regina. Claudio ingaggia i tuoi ex compagni Rosencrantz e Guildenstern per spiarti, mentre Polonio ritiene tu sia pazzo per amore di Ofelia. Giunge a corte una compagnia di attori girovaghi.',
        is_root: false,
        choices: [
          { text: 'Fai mettere in scena la tragedia dell\'uccisione di Gonzago', feedback: 'Usi il teatro come trappola per smascherare le reazioni di Claudio.', next_title: '4. La Trappola Teatrale' },
          { text: 'Rifiuta Ofelia e affronta tua madre nel suo privato', feedback: 'Cerca un confronto drammatico dentro gli appartamenti reali.', next_title: '5. La Tragedia nelle Stanze Reali' }
        ]
      },
      {
        id: 'node-h3',
        title: '3. La Rivolta della Corte',
        content: 'Senza prove concrete oltre alle parole di uno spettro, il tuo attacco diretto viene visto come un tentato colpo di Stato. Le guardie reali ti immobilizzano prima che tu possa colpire Claudio.',
        is_root: false,
        choices: [] // FINALE 1
      },
      {
        id: 'node-h4',
        title: '4. La Trappola Teatrale',
        content: 'Durante la rappresentazione del delitto, Claudio si alza turbato e abbandona la sala. La sua colpevolezza è confermata! Poco dopo lo trovi in ginocchio a pregare da solo nella cappella.',
        is_root: false,
        choices: [
          { text: 'Uccidilo mentre prega', feedback: 'Compi la tua vendetta immediatamente.', next_title: '5. La Tragedia nelle Stanze Reali' },
          { text: 'Risparmialo per non mandare la sua anima in Paradiso', feedback: 'Rinvii la vendetta per attendere un momento in cui sia sommerso dal peccato.', next_title: '6. Il Duello e la Tragedia Finale' }
        ]
      },
      {
        id: 'node-h5',
        title: '5. La Tragedia nelle Stanze Reali',
        content: 'Nella foga del confronto con tua madre, avverti un rumore dietro l\'arazzo e sguaini la spada uccidendo l\'intruso, scoprendo che si tratta di Polonio. Questo gesto scatena la follia di Ofelia e la sete di vendetta di Laerte.',
        is_root: false,
        choices: [
          { text: 'Accetta il duello di scherma proposto da Claudio e Laerte', feedback: 'Partecipi alla disfida tragica organizzata dal re.', next_title: '6. Il Duello e la Tragedia Finale' },
          { text: 'Tenta di riconciliarti con Laerte rivelando la trappola di Claudio', feedback: 'Cerchi un dialogo sincero con Laerte prima che sia troppo tardi.', next_title: '7. L\'Alleanza Inaspettata' }
        ]
      },
      {
        id: 'node-h6',
        title: '6. Il Duello e la Tragedia Finale',
        content: 'La spada di Laerte è avvelenata e la coppa del re contiene veleno. Durante il duello, la regina beve dalla coppa per sbaglio, tu e Laerte vi ferite a vicenda con le lame avvelenate. Prima di spirare, trafiggi Claudio realizzando la vendetta al prezzo della rovina dell\'intera dinastia.',
        is_root: false,
        choices: [] // FINALE 2 (Classico)
      },
      {
        id: 'node-h7',
        title: '7. L\'Alleanza Inaspettata',
        content: 'Commosso dalle tue parole e scoprendo che la lama fornita da Claudio era intrisa di veleno, Laerte comprende l\'inganno del sovrano. Insieme smascherate il complotto davanti all\'intera corte: Claudio viene arrestato e giustiziato per alto tradimento, ma il prezzo di sangue pagato lascia il regno privo di eredi diretti.',
        is_root: false,
        choices: [] // FINALE 3 (Nuovo)
      }
    ]
  },
  {
    id: 'template-transizione-energetica',
    title: 'La Transizione Energetica (Scienza & Sostenibilità)',
    description: 'Gestisci il piano di riconversione ecologica di una grande città industriale entro il 2030.',
    icon: '🌱',
    category: 'Scienza & Ambiente',
    nodes: [
      {
        id: 'node-e1',
        title: '1. Il Piano di Riconversione',
        content: 'Sei il Sindaco di una metropoli dipendente da una centrale a carbone locale che garantisce energia a basso costo e migliaia di posti di lavoro, ma causa gravi emissioni nocive. Il governo centrale offre fondi europei per la transizione ecologica.',
        is_root: true,
        choices: [
          { text: 'Chiudi subito la centrale e investi tutto su Solare ed Eolico', feedback: 'Scelta ecologica radicale con forte impatto sui costi e sui lavoratori.', next_title: '2. La Crisi Occupazionale ed Energetica' },
          { text: 'Converti la centrale a Gas Naturale come soluzione di transizione', feedback: 'Riduci l\'inquinamento immediato mantenendo la stabilità economica.', next_title: '3. La Soluzione Intermedia' }
        ]
      },
      {
        id: 'node-e2',
        title: '2. La Crisi Occupazionale ed Energetica',
        content: 'Le fonti rinnovabili non coprono ancora il fabbisogno invernale della città, causando blackout intermittenti e l\'aumento delle bollette. I sindacati dei lavoratori dell\'ex centrale protestano in piazza.',
        is_root: false,
        choices: [
          { text: 'Finanzia la riqualificazione dei lavoratori nel settore green', feedback: 'Istituisci corsi di formazione per riconvertire la forza lavoro.', next_title: '4. La Citta Modello Ecosostenibile' },
          { text: 'Importa energia nucleare dai paesi vicini per coprire il deficit', feedback: 'Garantisci stabilità energetica ma scateni polemiche sul nucleare.', next_title: '5. Il Compromesso Nucleare' }
        ]
      },
      {
        id: 'node-e3',
        title: '3. La Soluzione Intermedia',
        content: 'La conversione a gas riduce del 50% il particolato nell\'aria, ma le associazioni ambientaliste vi accusano di "Greenwashing" e di non rispettare gli accordi sul clima a lungo termine.',
        is_root: false,
        choices: [
          { text: 'Imponi una sovratassa sulle emissioni aziendali per finanziare il green', feedback: 'Usi le leve fiscali per accelerare la transizione.', next_title: '4. La Citta Modello Ecosostenibile' },
          { text: 'Mantieni il Gas Naturale stabilmente rinviando le rinnovabili', feedback: 'Privilegi la stabilità economica immediata rispetto all\'ambiente.', next_title: '6. Lo Stagnamento Ecologico' }
        ]
      },
      {
        id: 'node-e4',
        title: '4. La Citta Modello Ecosostenibile',
        content: 'Grazie agli investimenti sulla formazione e alle energie pulite, la città azzera le emissioni nette entro il termine stabilito, diventando un punto di riferimento europeo per la green economy e la qualità della vita.',
        is_root: false,
        choices: [] // FINALE 1
      },
      {
        id: 'node-e5',
        title: '5. Il Compromesso Nucleare',
        content: 'L\'energia importata garantisce il funzionamento delle industrie a zero emissioni dirette, ma la dipendenza dall\'estero e la gestione delle scorie rimangono temi caldi al centro del dibattito cittadino.',
        is_root: false,
        choices: [] // FINALE 2
      },
      {
        id: 'node-e6',
        title: '6. Lo Stagnamento Ecologico',
        content: 'La città evita shock economici a breve termine, ma subisce le sanzioni europee sul clima e l\'aumento delle malattie respiratorie legate al persistere delle fonti fossili.',
        is_root: false,
        choices: [] // FINALE 3
      }
    ]
  }
];