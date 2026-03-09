'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, MapPin, Phone, Clock, Globe, ExternalLink, ChevronRight,
  ChevronLeft, FileText, User, CreditCard, AlertTriangle, Info,
  CheckCircle2, Mail, Calendar,
} from 'lucide-react';

type ServiceId = 'aire' | 'passport' | 'id_card' | 'civil_registry' | 'citizenship' | 'legalization' | 'pension' | 'voting' | 'notarial';
type Lang = 'en' | 'pt';

interface ServiceInfo {
  id: ServiceId;
  icon: string;
  nameEn: string;
  namePt: string;
  descEn: string;
  descPt: string;
  stepsEn: { title: string; details: string[] }[];
  stepsPt: { title: string; details: string[] }[];
  docsEn: string[];
  docsPt: string[];
  costsEn: { item: string; cost: string }[];
  costsPt: { item: string; cost: string }[];
  linksEn: { name: string; url: string }[];
  linksPt: { name: string; url: string }[];
  tipsEn: string[];
  tipsPt: string[];
}

const CONSULATE_INFO = {
  name: 'Consolato Generale d\'Italia a Londra',
  address: 'Harp House, 83-86 Farringdon Street, London EC4A 4BL',
  phone: '+44 (0)20 7936 5900',
  email: 'consolato.londra@esteri.it',
  website: 'https://conslondra.esteri.it',
  prenota: 'https://prenotami.esteri.it',
  hours: 'Mon-Fri 9:00-12:30 (public), 14:00-16:00 (by appointment)',
  emergency: '+44 (0)7508 511 711 (emergencies only, outside office hours)',
  metro: 'Farringdon (Circle, Hammersmith & City, Metropolitan, Elizabeth lines)',
};

const SERVICES: ServiceInfo[] = [
  {
    id: 'aire',
    icon: '🏠',
    nameEn: 'AIRE Registration (Change of Address)',
    namePt: 'Inscrição AIRE (Mudança de Endereço)',
    descEn: 'Register or update your address in the AIRE (Registry of Italians Abroad). Mandatory for all Italian citizens living outside Italy for more than 12 months.',
    descPt: 'Registrar ou atualizar seu endereço no AIRE (Anagrafe degli Italiani Residenti all\'Estero). Obrigatório para todos os cidadãos italianos residentes fora da Itália por mais de 12 meses.',
    stepsEn: [
      { title: '1. Access the Fast It Portal', details: [
        'Go to https://serviziconsolari.esteri.it (Fast It)',
        'Create an account or log in with SPID/CIE',
        'Select "Anagrafe — Iscrizione AIRE" or "Cambio indirizzo"',
      ]},
      { title: '2. Fill in the Online Form', details: [
        'Enter your personal details (name, date of birth, codice fiscale)',
        'Provide your new UK address',
        'Provide your last Italian address (comune di iscrizione)',
        'Upload required documents',
      ]},
      { title: '3. Upload Documents', details: [
        'Scan and upload: passport, proof of UK address, codice fiscale',
        'For change of address: new utility bill or council tax bill',
        'All documents must be clear and legible',
      ]},
      { title: '4. Submit and Wait', details: [
        'Submit the request online',
        'The consulate will process it (usually 30-90 days)',
        'You may receive a visit from consular staff to verify your address',
        'You\'ll receive email confirmation when complete',
      ]},
    ],
    stepsPt: [
      { title: '1. Acessar o Portal Fast It', details: [
        'Acesse https://serviziconsolari.esteri.it (Fast It)',
        'Crie uma conta ou entre com SPID/CIE',
        'Selecione "Anagrafe — Iscrizione AIRE" ou "Cambio indirizzo"',
      ]},
      { title: '2. Preencher o Formulário Online', details: [
        'Insira seus dados pessoais (nome, data de nascimento, codice fiscale)',
        'Informe seu novo endereço no UK',
        'Informe seu último endereço na Itália (comune di iscrizione)',
        'Envie os documentos necessários',
      ]},
      { title: '3. Enviar Documentos', details: [
        'Escaneie e envie: passaporte, comprovante de endereço UK, codice fiscale',
        'Para mudança de endereço: conta de luz/gás ou council tax atualizada',
        'Todos os documentos devem estar legíveis',
      ]},
      { title: '4. Enviar e Aguardar', details: [
        'Envie a solicitação online',
        'O consulado processará (geralmente 30-90 dias)',
        'Você pode receber visita de funcionário consular para verificar endereço',
        'Receberá confirmação por email quando concluído',
      ]},
    ],
    docsEn: [
      'Valid Italian passport or ID card',
      'Proof of UK address (utility bill, council tax bill, bank statement — less than 3 months old)',
      'Codice fiscale (Italian tax code)',
      'For new registration: last Italian address details (comune)',
    ],
    docsPt: [
      'Passaporte italiano ou carta de identidade válidos',
      'Comprovante de endereço UK (conta de luz, council tax, extrato bancário — menos de 3 meses)',
      'Codice fiscale (código fiscal italiano)',
      'Para novo registro: dados do último endereço na Itália (comune)',
    ],
    costsEn: [{ item: 'AIRE Registration/Update', cost: 'Free' }],
    costsPt: [{ item: 'Inscrição/Atualização AIRE', cost: 'Gratuito' }],
    linksEn: [
      { name: 'Fast It Portal', url: 'https://serviziconsolari.esteri.it' },
      { name: 'AIRE Information', url: 'https://conslondra.esteri.it/it/i-servizi/per-i-cittadini/anagrafe/' },
    ],
    linksPt: [
      { name: 'Portal Fast It', url: 'https://serviziconsolari.esteri.it' },
      { name: 'Informações AIRE', url: 'https://conslondra.esteri.it/it/i-servizi/per-i-cittadini/anagrafe/' },
    ],
    tipsEn: [
      '⚠️ AIRE registration is MANDATORY by law — you can be fined for not registering',
      '💡 Always update your address within 30 days of moving',
      '📧 Keep your email updated in the system for important communications',
      '🗳️ You MUST be registered in AIRE to vote from abroad',
    ],
    tipsPt: [
      '⚠️ Inscrição no AIRE é OBRIGATÓRIA por lei — multa por não se registrar',
      '💡 Sempre atualize seu endereço dentro de 30 dias após mudar',
      '📧 Mantenha seu email atualizado no sistema para comunicações importantes',
      '🗳️ Você PRECISA estar registrado no AIRE para votar do exterior',
    ],
  },
  {
    id: 'passport',
    icon: '🛂',
    nameEn: 'Italian Passport',
    namePt: 'Passaporte Italiano',
    descEn: 'Apply for a new Italian passport, renew an expired one, or report a lost/stolen passport. Italian passports are valid for 10 years (5 years for minors).',
    descPt: 'Solicitar novo passaporte italiano, renovar expirado, ou reportar perda/roubo. Passaportes italianos são válidos por 10 anos (5 anos para menores).',
    stepsEn: [
      { title: '1. Book an Appointment', details: [
        'Go to https://prenotami.esteri.it',
        'Log in or create an account',
        'Select "Passaporti" and choose an available date',
        '⚠️ Appointments can be scarce — check regularly, especially early morning',
      ]},
      { title: '2. Prepare Your Documents', details: [
        'Complete the passport application form (download from consulate website)',
        'Get a passport photo (Italian standards: 35x45mm, white background)',
        'Old/expired passport (if renewing)',
        'Police report if lost/stolen',
      ]},
      { title: '3. Attend Your Appointment', details: [
        'Go to the consulate at your booked time',
        'Bring ALL original documents',
        'Fingerprints will be taken digitally',
        'Pay the fee',
      ]},
      { title: '4. Collect Your Passport', details: [
        'Processing time: usually 2-6 weeks',
        'You\'ll receive a notification when ready',
        'Collect in person at the consulate (or request postal delivery if available)',
        'Check all details are correct before leaving',
      ]},
    ],
    stepsPt: [
      { title: '1. Agendar Horário', details: [
        'Acesse https://prenotami.esteri.it',
        'Faça login ou crie uma conta',
        'Selecione "Passaporti" e escolha uma data disponível',
        '⚠️ Horários podem ser escassos — verifique regularmente, especialmente de manhã cedo',
      ]},
      { title: '2. Preparar Documentos', details: [
        'Preencha o formulário de passaporte (baixe do site do consulado)',
        'Tire foto para passaporte (padrão italiano: 35x45mm, fundo branco)',
        'Passaporte antigo/expirado (se renovando)',
        'Boletim de ocorrência se perdido/roubado',
      ]},
      { title: '3. Comparecer ao Agendamento', details: [
        'Vá ao consulado no horário agendado',
        'Leve TODOS os documentos originais',
        'Impressões digitais serão coletadas digitalmente',
        'Pague a taxa',
      ]},
      { title: '4. Retirar o Passaporte', details: [
        'Tempo de processamento: geralmente 2-6 semanas',
        'Receberá notificação quando pronto',
        'Retire pessoalmente no consulado (ou solicite envio pelos correios se disponível)',
        'Verifique todos os dados antes de sair',
      ]},
    ],
    docsEn: [
      'Completed passport application form',
      '2 passport photos (35x45mm, white background, recent)',
      'Old/expired passport (original)',
      'Italian codice fiscale',
      'Proof of AIRE registration',
      'Police report (if lost/stolen)',
      'For minors: both parents\' consent + birth certificate',
    ],
    docsPt: [
      'Formulário de passaporte preenchido',
      '2 fotos para passaporte (35x45mm, fundo branco, recentes)',
      'Passaporte antigo/expirado (original)',
      'Codice fiscale italiano',
      'Comprovante de inscrição AIRE',
      'Boletim de ocorrência (se perdido/roubado)',
      'Para menores: consentimento de ambos os pais + certidão de nascimento',
    ],
    costsEn: [
      { item: 'New passport (adults)', cost: '€116.00' },
      { item: 'New passport (minors 0-3)', cost: '€116.00 (valid 3 years)' },
      { item: 'New passport (minors 3-18)', cost: '€116.00 (valid 5 years)' },
      { item: 'Emergency/temporary passport', cost: '€116.00' },
    ],
    costsPt: [
      { item: 'Novo passaporte (adultos)', cost: '€116,00' },
      { item: 'Novo passaporte (menores 0-3)', cost: '€116,00 (válido 3 anos)' },
      { item: 'Novo passaporte (menores 3-18)', cost: '€116,00 (válido 5 anos)' },
      { item: 'Passaporte emergencial/temporário', cost: '€116,00' },
    ],
    linksEn: [
      { name: 'Book Appointment', url: 'https://prenotami.esteri.it' },
      { name: 'Passport Information', url: 'https://conslondra.esteri.it/it/i-servizi/per-i-cittadini/passaporti/' },
    ],
    linksPt: [
      { name: 'Agendar Horário', url: 'https://prenotami.esteri.it' },
      { name: 'Informações sobre Passaporte', url: 'https://conslondra.esteri.it/it/i-servizi/per-i-cittadini/passaporti/' },
    ],
    tipsEn: [
      '💡 Book your appointment months in advance — slots fill up very quickly',
      '📸 Get photos at an Italian-style photo booth or photographer who knows the specifications',
      '⏰ Arrive 15 minutes early for your appointment',
      '💳 Payment: usually by card or postal order (check current accepted methods)',
      '🔄 Start the renewal process 6 months before expiry for hassle-free travel',
    ],
    tipsPt: [
      '💡 Agende com meses de antecedência — horários lotam muito rápido',
      '📸 Tire fotos em estúdio que conheça as especificações italianas',
      '⏰ Chegue 15 minutos antes do agendamento',
      '💳 Pagamento: geralmente cartão ou postal order (verifique métodos aceitos)',
      '🔄 Comece a renovação 6 meses antes do vencimento para viajar sem problemas',
    ],
  },
  {
    id: 'id_card',
    icon: '💳',
    nameEn: 'Italian Electronic ID Card (CIE)',
    namePt: 'Carta de Identidade Eletrônica Italiana (CIE)',
    descEn: 'The Carta d\'Identità Elettronica (CIE) is the new Italian digital ID card. It can be used for travel within the EU and for digital authentication (SPID alternative).',
    descPt: 'A Carta d\'Identità Elettronica (CIE) é o novo documento de identidade digital italiano. Pode ser usado para viajar na UE e autenticação digital (alternativa ao SPID).',
    stepsEn: [
      { title: '1. Book an Appointment', details: [
        'Go to https://prenotami.esteri.it',
        'Select "Carta d\'Identità Elettronica"',
        'Choose an available date and time',
      ]},
      { title: '2. Prepare Documents', details: [
        'Complete the CIE application form',
        'Get a passport-style photo (digital format may also be needed)',
        'Bring your current passport',
        'Bring proof of AIRE registration',
      ]},
      { title: '3. Attend Appointment', details: [
        'Biometric data collected (fingerprints, photo)',
        'Verify your personal details',
        'Pay the fee',
        'Sign the application',
      ]},
      { title: '4. Receive Your CIE', details: [
        'The CIE is produced in Italy and sent to the consulate',
        'Processing: 2-4 weeks typically',
        'Collect in person when notified',
        'You\'ll receive PIN codes for digital use',
      ]},
    ],
    stepsPt: [
      { title: '1. Agendar Horário', details: [
        'Acesse https://prenotami.esteri.it',
        'Selecione "Carta d\'Identità Elettronica"',
        'Escolha data e horário disponíveis',
      ]},
      { title: '2. Preparar Documentos', details: [
        'Preencha o formulário da CIE',
        'Tire foto tipo passaporte (formato digital pode ser necessário)',
        'Leve seu passaporte atual',
        'Leve comprovante de inscrição AIRE',
      ]},
      { title: '3. Comparecer ao Agendamento', details: [
        'Dados biométricos coletados (impressões digitais, foto)',
        'Verificação dos dados pessoais',
        'Pagamento da taxa',
        'Assinatura da solicitação',
      ]},
      { title: '4. Receber a CIE', details: [
        'A CIE é produzida na Itália e enviada ao consulado',
        'Processamento: geralmente 2-4 semanas',
        'Retire pessoalmente quando notificado',
        'Receberá códigos PIN para uso digital',
      ]},
    ],
    docsEn: [
      'Current Italian passport',
      'Codice fiscale',
      'Passport-style photo',
      'Proof of AIRE registration',
      'Old ID card (if renewing)',
    ],
    docsPt: [
      'Passaporte italiano atual',
      'Codice fiscale',
      'Foto tipo passaporte',
      'Comprovante de inscrição AIRE',
      'Carta de identidade antiga (se renovando)',
    ],
    costsEn: [{ item: 'CIE (Electronic ID Card)', cost: '€22.21' }],
    costsPt: [{ item: 'CIE (Carta de Identidade Eletrônica)', cost: '€22,21' }],
    linksEn: [
      { name: 'Book Appointment', url: 'https://prenotami.esteri.it' },
      { name: 'CIE Information', url: 'https://www.cartaidentita.interno.gov.it/' },
    ],
    linksPt: [
      { name: 'Agendar Horário', url: 'https://prenotami.esteri.it' },
      { name: 'Informações CIE', url: 'https://www.cartaidentita.interno.gov.it/' },
    ],
    tipsEn: [
      '💡 The CIE can be used as a travel document within the EU/EEA',
      '📱 The CIE app allows digital authentication — useful for Italian government services',
      '🔐 Keep your PIN codes safe — you need them for digital services',
      '⏰ CIE is valid for 10 years (adults), 5 years (minors 3-18), 3 years (0-3)',
    ],
    tipsPt: [
      '💡 A CIE pode ser usada como documento de viagem na UE/EEE',
      '📱 O app CIE permite autenticação digital — útil para serviços do governo italiano',
      '🔐 Guarde seus códigos PIN — necessários para serviços digitais',
      '⏰ CIE válida por 10 anos (adultos), 5 anos (menores 3-18), 3 anos (0-3)',
    ],
  },
  {
    id: 'civil_registry',
    icon: '📋',
    nameEn: 'Civil Registry (Births, Marriages, Deaths)',
    namePt: 'Registro Civil (Nascimentos, Casamentos, Óbitos)',
    descEn: 'Register births, marriages, and deaths that occur in the UK with the Italian authorities. Transcription of UK events into Italian civil registry.',
    descPt: 'Registrar nascimentos, casamentos e óbitos ocorridos no UK junto às autoridades italianas. Transcrição de eventos UK no registro civil italiano.',
    stepsEn: [
      { title: '1. Obtain UK Certificate', details: [
        'Get the official UK certificate (birth, marriage, or death certificate)',
        'Order an apostille from the UK Foreign Office (FCDO) — online service',
        'Apostille cost: £30 per document',
      ]},
      { title: '2. Translate the Document', details: [
        'Get an official Italian translation of the UK certificate',
        'Translation must be done by a certified translator',
        'Some consulates accept self-translations if signed at the consulate',
      ]},
      { title: '3. Submit to Consulate', details: [
        'Book appointment via Prenota Mi',
        'Bring original certificate + apostille + translation',
        'Complete the consular registration form',
        'Pay any applicable fees',
      ]},
      { title: '4. Wait for Transcription', details: [
        'The consulate sends documents to your comune in Italy',
        'The comune transcribes the event into Italian civil records',
        'Processing: 1-6 months depending on the comune',
      ]},
    ],
    stepsPt: [
      { title: '1. Obter Certidão UK', details: [
        'Obtenha a certidão oficial do UK (nascimento, casamento ou óbito)',
        'Solicite apostila do FCDO (Foreign Office) — serviço online',
        'Custo da apostila: £30 por documento',
      ]},
      { title: '2. Traduzir o Documento', details: [
        'Faça tradução oficial em italiano da certidão UK',
        'Tradução deve ser feita por tradutor certificado',
        'Alguns consulados aceitam auto-tradução se assinada no consulado',
      ]},
      { title: '3. Entregar no Consulado', details: [
        'Agende horário via Prenota Mi',
        'Leve certidão original + apostila + tradução',
        'Preencha o formulário de registro consular',
        'Pague as taxas aplicáveis',
      ]},
      { title: '4. Aguardar Transcrição', details: [
        'O consulado envia documentos ao seu comune na Itália',
        'O comune transcreve o evento nos registros civis italianos',
        'Processamento: 1-6 meses dependendo do comune',
      ]},
    ],
    docsEn: [
      'Original UK certificate (birth/marriage/death)',
      'Apostille from FCDO',
      'Italian translation by certified translator',
      'Italian passport or ID',
      'Codice fiscale',
    ],
    docsPt: [
      'Certidão original UK (nascimento/casamento/óbito)',
      'Apostila do FCDO',
      'Tradução italiana por tradutor certificado',
      'Passaporte ou identidade italiana',
      'Codice fiscale',
    ],
    costsEn: [
      { item: 'UK Apostille (FCDO)', cost: '£30 per document' },
      { item: 'Certified translation', cost: '£50-150 (varies)' },
      { item: 'Consular registration', cost: 'Free' },
    ],
    costsPt: [
      { item: 'Apostila UK (FCDO)', cost: '£30 por documento' },
      { item: 'Tradução certificada', cost: '£50-150 (varia)' },
      { item: 'Registro consular', cost: 'Gratuito' },
    ],
    linksEn: [
      { name: 'FCDO Apostille Service', url: 'https://www.gov.uk/get-document-legalised' },
      { name: 'Book Appointment', url: 'https://prenotami.esteri.it' },
    ],
    linksPt: [
      { name: 'Serviço de Apostila FCDO', url: 'https://www.gov.uk/get-document-legalised' },
      { name: 'Agendar Horário', url: 'https://prenotami.esteri.it' },
    ],
    tipsEn: [
      '💡 Order the apostille FIRST — it\'s the longest step',
      '📋 The apostille is attached to the certificate — do NOT separate them',
      '⚠️ Birth registration in Italy is essential for your child to have Italian citizenship',
    ],
    tipsPt: [
      '💡 Solicite a apostila PRIMEIRO — é a etapa mais demorada',
      '📋 A apostila é anexada à certidão — NÃO separe',
      '⚠️ Registro de nascimento na Itália é essencial para a criança ter cidadania italiana',
    ],
  },
  {
    id: 'citizenship',
    icon: '🇮🇹',
    nameEn: 'Italian Citizenship Recognition (Jure Sanguinis)',
    namePt: 'Reconhecimento de Cidadania Italiana (Jure Sanguinis)',
    descEn: 'Apply for recognition of Italian citizenship by descent (jure sanguinis) if you have Italian ancestry. This is the process for Brazilians with Italian heritage.',
    descPt: 'Solicitar reconhecimento de cidadania italiana por descendência (jure sanguinis) se você tem ancestralidade italiana. Este é o processo para brasileiros com herança italiana.',
    stepsEn: [
      { title: '1. Research Your Italian Ancestor', details: [
        'Identify the Italian ancestor who emigrated (the "avo italiano")',
        'Verify they did NOT naturalize in another country BEFORE the birth of the next generation',
        'Build your family tree from the Italian ancestor to you — every generation must be documented',
      ]},
      { title: '2. Gather All Certificates', details: [
        'Birth, marriage, and death certificates for EVERY person in the line',
        'Starting from the Italian ancestor down to you',
        'Italian ancestor\'s birth certificate from the Italian comune',
        'CNN (Certificado de Não Naturalização) from Brazil if applicable',
      ]},
      { title: '3. Apostille & Translate All Documents', details: [
        'Brazilian documents: apostille from Brazilian cartório + sworn Italian translation',
        'UK documents: apostille from FCDO + certified Italian translation',
        'Italian documents: no apostille needed',
      ]},
      { title: '4. Book Appointment at Consulate', details: [
        'Go to https://prenotami.esteri.it',
        'Select "Cittadinanza — Riconoscimento"',
        '⚠️ Wait times for appointments can be VERY long (months to years)',
        'Check regularly for cancellations',
      ]},
      { title: '5. Submit Your Application', details: [
        'Attend with ALL original documents + copies',
        'The consulate reviews your documentation',
        'Processing: officially up to 730 days (2 years) by law',
        'You\'ll receive your Italian passport once approved',
      ]},
    ],
    stepsPt: [
      { title: '1. Pesquisar seu Ancestral Italiano', details: [
        'Identifique o ancestral italiano que emigrou (o "avo italiano")',
        'Verifique que ele NÃO se naturalizou em outro país ANTES do nascimento da próxima geração',
        'Monte sua árvore genealógica do ancestral italiano até você — cada geração deve ser documentada',
      ]},
      { title: '2. Reunir Todas as Certidões', details: [
        'Certidões de nascimento, casamento e óbito de CADA pessoa na linha',
        'Começando do ancestral italiano até você',
        'Certidão de nascimento do ancestral italiano do comune italiano',
        'CNN (Certificado de Não Naturalização) do Brasil se aplicável',
      ]},
      { title: '3. Apostilar e Traduzir Todos os Documentos', details: [
        'Documentos brasileiros: apostila de cartório brasileiro + tradução juramentada em italiano',
        'Documentos UK: apostila do FCDO + tradução certificada em italiano',
        'Documentos italianos: não precisam de apostila',
      ]},
      { title: '4. Agendar Horário no Consulado', details: [
        'Acesse https://prenotami.esteri.it',
        'Selecione "Cittadinanza — Riconoscimento"',
        '⚠️ Tempo de espera para agendamento pode ser MUITO longo (meses a anos)',
        'Verifique regularmente por cancelamentos',
      ]},
      { title: '5. Entregar sua Aplicação', details: [
        'Compareça com TODOS os documentos originais + cópias',
        'O consulado revisa a documentação',
        'Processamento: oficialmente até 730 dias (2 anos) por lei',
        'Receberá seu passaporte italiano quando aprovado',
      ]},
    ],
    docsEn: [
      'Birth certificate of Italian ancestor (from Italian comune)',
      'Birth, marriage, and death certificates for every person in the lineage',
      'CNN (Certificate of Non-Naturalization) from Brazil',
      'All certificates apostilled',
      'All non-Italian certificates translated into Italian by sworn translator',
      'Your valid passport',
      'Proof of UK residence (AIRE registration)',
    ],
    docsPt: [
      'Certidão de nascimento do ancestral italiano (do comune italiano)',
      'Certidões de nascimento, casamento e óbito de cada pessoa na linhagem',
      'CNN (Certificado de Não Naturalização) do Brasil',
      'Todas as certidões apostiladas',
      'Todas as certidões não-italianas traduzidas para italiano por tradutor juramentado',
      'Seu passaporte válido',
      'Comprovante de residência UK (inscrição AIRE)',
    ],
    costsEn: [
      { item: 'Citizenship application fee', cost: '€300' },
      { item: 'Brazilian apostilles', cost: '~R$100-200 each' },
      { item: 'UK apostilles (FCDO)', cost: '£30 each' },
      { item: 'Sworn translations', cost: '£80-200 per document' },
      { item: 'Italian comune certificates', cost: '€5-20 each' },
    ],
    costsPt: [
      { item: 'Taxa de aplicação de cidadania', cost: '€300' },
      { item: 'Apostilas brasileiras', cost: '~R$100-200 cada' },
      { item: 'Apostilas UK (FCDO)', cost: '£30 cada' },
      { item: 'Traduções juramentadas', cost: '£80-200 por documento' },
      { item: 'Certidões de comune italiano', cost: '€5-20 cada' },
    ],
    linksEn: [
      { name: 'Book Appointment', url: 'https://prenotami.esteri.it' },
      { name: 'Consulate Citizenship Info', url: 'https://conslondra.esteri.it/it/i-servizi/per-i-cittadini/cittadinanza/' },
    ],
    linksPt: [
      { name: 'Agendar Horário', url: 'https://prenotami.esteri.it' },
      { name: 'Info Cidadania Consulado', url: 'https://conslondra.esteri.it/it/i-servizi/per-i-cittadini/cittadinanza/' },
    ],
    tipsEn: [
      '⚠️ This process can take 2-4 years total — start gathering documents NOW',
      '💡 The most common blocker: the Italian ancestor naturalized before the next child was born',
      '📋 Get inteiro teor (full format) certificates from Brazil, not just regular ones',
      '🇧🇷 Brazilian CNN: request from the Ministério da Justiça in Brasília',
      '💡 Consider hiring a specialized agency (assessoria) if the process seems overwhelming',
      '📧 Join Facebook groups for "Cidadania Italiana em Londres" for community tips',
    ],
    tipsPt: [
      '⚠️ Este processo pode levar 2-4 anos no total — comece a reunir documentos AGORA',
      '💡 O bloqueio mais comum: o ancestral italiano se naturalizou antes do nascimento do próximo filho',
      '📋 Peça certidões de inteiro teor do Brasil, não apenas formato simples',
      '🇧🇷 CNN brasileira: solicite no Ministério da Justiça em Brasília',
      '💡 Considere contratar assessoria especializada se o processo parecer complexo demais',
      '📧 Participe de grupos no Facebook "Cidadania Italiana em Londres" para dicas da comunidade',
    ],
  },
  {
    id: 'legalization',
    icon: '📜',
    nameEn: 'Document Legalization & Apostille',
    namePt: 'Legalização de Documentos e Apostila',
    descEn: 'Legalize Italian or foreign documents for use abroad. Get documents authenticated for legal validity.',
    descPt: 'Legalizar documentos italianos ou estrangeiros para uso no exterior. Autenticar documentos para validade legal.',
    stepsEn: [
      { title: '1. Determine What You Need', details: [
        'Apostille: for documents going to Hague Convention countries',
        'Legalization: for documents going to non-Hague countries',
        'Some documents need both translation and legalization',
      ]},
      { title: '2. Book and Attend', details: [
        'Book via Prenota Mi',
        'Bring original document',
        'Pay fee and collect legalized document',
      ]},
    ],
    stepsPt: [
      { title: '1. Determinar o que Precisa', details: [
        'Apostila: para documentos destinados a países da Convenção de Haia',
        'Legalização: para documentos destinados a países fora da Convenção',
        'Alguns documentos precisam de tradução E legalização',
      ]},
      { title: '2. Agendar e Comparecer', details: [
        'Agende via Prenota Mi',
        'Leve documento original',
        'Pague taxa e retire documento legalizado',
      ]},
    ],
    docsEn: ['Original document to be legalized', 'Valid ID/passport', 'Application form'],
    docsPt: ['Documento original a ser legalizado', 'Identidade/passaporte válido', 'Formulário de solicitação'],
    costsEn: [{ item: 'Legalization', cost: '€16.00 per document' }],
    costsPt: [{ item: 'Legalização', cost: '€16,00 por documento' }],
    linksEn: [{ name: 'Book Appointment', url: 'https://prenotami.esteri.it' }],
    linksPt: [{ name: 'Agendar Horário', url: 'https://prenotami.esteri.it' }],
    tipsEn: ['💡 UK documents for Italy: get FCDO apostille first, then translate'],
    tipsPt: ['💡 Documentos UK para Itália: obtenha apostila FCDO primeiro, depois traduza'],
  },
  {
    id: 'pension',
    icon: '💰',
    nameEn: 'Italian Pension (INPS)',
    namePt: 'Aposentadoria Italiana (INPS)',
    descEn: 'Information about Italian state pension (INPS) for Italian citizens living in the UK. Claim your Italian pension or check your contributions.',
    descPt: 'Informações sobre aposentadoria italiana (INPS) para cidadãos italianos residentes no UK. Solicitar aposentadoria ou verificar contribuições.',
    stepsEn: [
      { title: '1. Check Your INPS Contributions', details: [
        'Access MyINPS portal: https://www.inps.it',
        'Use SPID or CIE to log in',
        'Check "Estratto Conto Contributivo" for your work history',
      ]},
      { title: '2. Apply for Pension', details: [
        'Apply through INPS online portal or via a patronato (free assistance)',
        'Patronati in London: INCA, INAS, ACLI — they help for free',
        'The consulate can provide referrals',
      ]},
    ],
    stepsPt: [
      { title: '1. Verificar Contribuições INPS', details: [
        'Acesse portal MyINPS: https://www.inps.it',
        'Use SPID ou CIE para fazer login',
        'Verifique "Estratto Conto Contributivo" para seu histórico de trabalho',
      ]},
      { title: '2. Solicitar Aposentadoria', details: [
        'Aplique pelo portal online do INPS ou via patronato (assistência gratuita)',
        'Patronati em Londres: INCA, INAS, ACLI — ajudam gratuitamente',
        'O consulado pode fornecer indicações',
      ]},
    ],
    docsEn: ['Italian passport/ID', 'Codice fiscale', 'SPID or CIE credentials', 'UK National Insurance number'],
    docsPt: ['Passaporte/identidade italiana', 'Codice fiscale', 'Credenciais SPID ou CIE', 'Número National Insurance UK'],
    costsEn: [{ item: 'Pension application', cost: 'Free' }, { item: 'Patronato assistance', cost: 'Free' }],
    costsPt: [{ item: 'Solicitação de aposentadoria', cost: 'Gratuito' }, { item: 'Assistência do patronato', cost: 'Gratuito' }],
    linksEn: [{ name: 'INPS Portal', url: 'https://www.inps.it' }],
    linksPt: [{ name: 'Portal INPS', url: 'https://www.inps.it' }],
    tipsEn: ['💡 UK and Italian pension contributions can be combined under bilateral agreements'],
    tipsPt: ['💡 Contribuições de aposentadoria UK e Itália podem ser combinadas por acordo bilateral'],
  },
  {
    id: 'voting',
    icon: '🗳️',
    nameEn: 'Voting from Abroad',
    namePt: 'Votação do Exterior',
    descEn: 'Italian citizens registered in AIRE can vote in Italian elections and referendums from abroad by postal vote.',
    descPt: 'Cidadãos italianos registrados no AIRE podem votar em eleições e referendos italianos do exterior por voto postal.',
    stepsEn: [
      { title: '1. Ensure AIRE Registration', details: [
        'You MUST be registered in AIRE to vote from abroad',
        'Verify your registration is current and address is correct',
      ]},
      { title: '2. Receive Your Ballot', details: [
        'Ballots are sent by post to your AIRE address',
        'Usually arrives 2-3 weeks before election day',
        'If not received, contact the consulate immediately',
      ]},
      { title: '3. Vote and Return', details: [
        'Fill in your ballot',
        'Place in the provided envelope',
        'Post it back before the deadline (usually election day)',
        'Postage is pre-paid',
      ]},
    ],
    stepsPt: [
      { title: '1. Garantir Registro AIRE', details: [
        'Você PRECISA estar registrado no AIRE para votar do exterior',
        'Verifique se seu registro está atualizado e endereço correto',
      ]},
      { title: '2. Receber a Cédula', details: [
        'Cédulas são enviadas por correio ao seu endereço AIRE',
        'Geralmente chega 2-3 semanas antes da eleição',
        'Se não receber, contate o consulado imediatamente',
      ]},
      { title: '3. Votar e Devolver', details: [
        'Preencha sua cédula',
        'Coloque no envelope fornecido',
        'Envie de volta antes do prazo (geralmente dia da eleição)',
        'Postagem é pré-paga',
      ]},
    ],
    docsEn: ['Valid AIRE registration', 'No additional documents needed for voting'],
    docsPt: ['Registro AIRE válido', 'Nenhum documento adicional necessário para votar'],
    costsEn: [{ item: 'Voting', cost: 'Free' }],
    costsPt: [{ item: 'Votação', cost: 'Gratuito' }],
    linksEn: [{ name: 'Electoral Information', url: 'https://conslondra.esteri.it' }],
    linksPt: [{ name: 'Informações Eleitorais', url: 'https://conslondra.esteri.it' }],
    tipsEn: ['💡 Keep your AIRE address updated — ballots go to the registered address only'],
    tipsPt: ['💡 Mantenha seu endereço AIRE atualizado — cédulas vão apenas para o endereço registrado'],
  },
  {
    id: 'notarial',
    icon: '✍️',
    nameEn: 'Notarial Services (Procuração / Power of Attorney)',
    namePt: 'Serviços Notariais (Procuração)',
    descEn: 'The consulate can authenticate signatures, issue powers of attorney (procura), and provide notarial services for Italian legal matters.',
    descPt: 'O consulado pode autenticar assinaturas, emitir procurações e fornecer serviços notariais para questões legais italianas.',
    stepsEn: [
      { title: '1. Prepare Your Document', details: [
        'Draft the power of attorney or document to be notarized',
        'If for property in Italy, consult an Italian notaio first for the exact wording',
      ]},
      { title: '2. Book and Attend', details: [
        'Book via Prenota Mi',
        'Bring the document, valid ID, and codice fiscale',
        'Sign in the presence of the consular officer',
        'Pay the applicable fee',
      ]},
    ],
    stepsPt: [
      { title: '1. Preparar o Documento', details: [
        'Rascunhe a procuração ou documento a ser notarizado',
        'Se for para imóvel na Itália, consulte um notaio italiano primeiro para o texto exato',
      ]},
      { title: '2. Agendar e Comparecer', details: [
        'Agende via Prenota Mi',
        'Leve o documento, identidade válida e codice fiscale',
        'Assine na presença do funcionário consular',
        'Pague a taxa aplicável',
      ]},
    ],
    docsEn: ['Draft document/power of attorney', 'Valid Italian passport or ID', 'Codice fiscale'],
    docsPt: ['Rascunho do documento/procuração', 'Passaporte ou identidade italiana válidos', 'Codice fiscale'],
    costsEn: [{ item: 'Notarial act', cost: '€16.00' }, { item: 'Authenticated copy', cost: '€3.00' }],
    costsPt: [{ item: 'Ato notarial', cost: '€16,00' }, { item: 'Cópia autenticada', cost: '€3,00' }],
    linksEn: [{ name: 'Book Appointment', url: 'https://prenotami.esteri.it' }],
    linksPt: [{ name: 'Agendar Horário', url: 'https://prenotami.esteri.it' }],
    tipsEn: ['💡 For Italian property transactions, always get the exact wording from the Italian notaio before coming to the consulate'],
    tipsPt: ['💡 Para transações de imóveis na Itália, obtenha o texto exato do notaio italiano antes de ir ao consulado'],
  },
];

export function ConsulateClient() {
  const [lang, setLang] = useState<Lang>('pt');
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null);

  const service = selectedService ? SERVICES.find(s => s.id === selectedService) : null;

  // Detail view for a service
  if (service) {
    const steps = lang === 'en' ? service.stepsEn : service.stepsPt;
    const docs = lang === 'en' ? service.docsEn : service.docsPt;
    const costs = lang === 'en' ? service.costsEn : service.costsPt;
    const links = lang === 'en' ? service.linksEn : service.linksPt;
    const tips = lang === 'en' ? service.tipsEn : service.tipsPt;

    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">{service.icon}</span>
            {lang === 'en' ? service.nameEn : service.namePt}
          </h2>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button className={`px-2 py-1 rounded text-xs font-medium ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setLang('en')}>🇬🇧</button>
              <button className={`px-2 py-1 rounded text-xs font-medium ${lang === 'pt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setLang('pt')}>🇧🇷</button>
            </div>
            <Button variant="outline" onClick={() => setSelectedService(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> {lang === 'en' ? 'Back' : 'Voltar'}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{lang === 'en' ? service.descEn : service.descPt}</p>

        {/* Steps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> {lang === 'en' ? 'Step-by-Step Guide' : 'Guia Passo a Passo'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4 p-3 border-l-2 border-green-500/30 ml-4 relative">
                <div className="absolute -left-[11px] top-3 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                <div className="flex-1 ml-3">
                  <h4 className="font-semibold text-sm">{step.title}</h4>
                  <div className="mt-1 space-y-0.5">
                    {step.details.map((d, j) => (
                      <p key={j} className="text-xs text-muted-foreground">{d}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {lang === 'en' ? 'Required Documents' : 'Documentos Necessários'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span>
                  <span className="text-muted-foreground">{doc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Costs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> {lang === 'en' ? 'Costs' : 'Custos'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {costs.map((c, i) => (
                <div key={i} className="flex justify-between p-2 rounded bg-muted text-sm">
                  <span>{c.item}</span>
                  <span className="font-semibold">{c.cost}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        {tips.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" /> {lang === 'en' ? 'Important Tips' : 'Dicas Importantes'}</h4>
              <div className="space-y-1">
                {tips.map((tip, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{tip}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          {links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-3 py-1.5 hover:bg-primary/20 transition-all">
              <ExternalLink className="h-3 w-3" /> {link.name}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-green-500" />
            {lang === 'en' ? 'Italian Consulate — London' : 'Consulado Italiano — Londres'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'en' ? 'Complete guide to consular services for Italian citizens and Brazilians with Italian heritage' : 'Guia completo dos serviços consulares para cidadãos italianos e brasileiros com herança italiana'}
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button className={`px-3 py-1 rounded text-xs font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setLang('en')}>🇬🇧 English</button>
          <button className={`px-3 py-1 rounded text-xs font-medium transition-all ${lang === 'pt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setLang('pt')}>🇧🇷 Português</button>
        </div>
      </div>

      {/* Consulate Info Card */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-green-400">{CONSULATE_INFO.name}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{CONSULATE_INFO.address}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5 shrink-0" />{CONSULATE_INFO.phone}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" />{CONSULATE_INFO.email}</p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5 shrink-0" />{CONSULATE_INFO.hours}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />{lang === 'en' ? 'Emergency' : 'Emergência'}: {CONSULATE_INFO.emergency}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />🚇 {CONSULATE_INFO.metro}</p>
              <div className="flex gap-2 mt-1">
                <a href={CONSULATE_INFO.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Globe className="h-3 w-3" /> Website
                </a>
                <a href={CONSULATE_INFO.prenota} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Calendar className="h-3 w-3" /> Prenota Mi
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">{lang === 'en' ? 'Almost all services require an appointment' : 'Quase todos os serviços requerem agendamento'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'en'
                ? 'Book your appointment at prenotami.esteri.it — slots fill up fast, especially for passports and citizenship. Check regularly for cancellations.'
                : 'Agende em prenotami.esteri.it — horários lotam rápido, especialmente para passaportes e cidadania. Verifique regularmente por cancelamentos.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SERVICES.map(s => (
          <Card key={s.id} className="hover:border-primary/50 transition-all cursor-pointer group" onClick={() => setSelectedService(s.id)}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">{s.icon}</span>
                  <h3 className="font-semibold text-sm mt-2">{lang === 'en' ? s.nameEn : s.namePt}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lang === 'en' ? s.descEn : s.descPt}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all shrink-0 mt-1" />
              </div>
              <div className="flex gap-1 mt-3">
                {(lang === 'en' ? s.costsEn : s.costsPt).slice(0, 1).map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{c.cost}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{lang === 'en' ? 'Quick Links' : 'Links Rápidos'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {[
              { name: 'Prenota Mi (Book Appointment)', url: 'https://prenotami.esteri.it', icon: '📅' },
              { name: 'Fast It (AIRE / Anagrafe)', url: 'https://serviziconsolari.esteri.it', icon: '🏠' },
              { name: lang === 'en' ? 'Consulate Website' : 'Site do Consulado', url: 'https://conslondra.esteri.it', icon: '🌐' },
              { name: 'INPS (Pension)', url: 'https://www.inps.it', icon: '💰' },
              { name: 'SPID (Digital Identity)', url: 'https://www.spid.gov.it', icon: '🔐' },
              { name: 'FCDO Apostille (UK)', url: 'https://www.gov.uk/get-document-legalised', icon: '📜' },
            ].map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-muted/50 border border-border/30 hover:border-primary/30 transition-all">
                <span>{link.icon}</span>
                <span className="text-xs font-medium flex-1">{link.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
