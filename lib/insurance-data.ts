/**
 * Insurance Intelligence Data
 * Claims guides, emergency contacts, comparison links, and UK market price ranges
 */

export interface ClaimStep {
  step: number;
  title: string;
  titlePt: string;
  description: string;
  descriptionPt: string;
  important?: boolean;
}

export interface ClaimGuide {
  type: string;
  title: string;
  titlePt: string;
  emergencyNumber: string;
  emergencyLabel: string;
  timeLimit: string;
  timeLimitPt: string;
  documentsNeeded: string[];
  documentsNeededPt: string[];
  steps: ClaimStep[];
  tips: string[];
  tipsPt: string[];
}

export interface ComparisonLink {
  name: string;
  url: string;
  types: string[];
}

export interface PriceRange {
  type: string;
  monthlyLow: number;
  monthlyHigh: number;
  factors: string[];
  factorsPt: string[];
}

// ─── CLAIMS GUIDES ────────────────────────────────────────────

export const CLAIMS_GUIDES: Record<string, ClaimGuide> = {
  car: {
    type: 'car',
    title: 'Car Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro de Carro',
    emergencyNumber: '999 (emergency) or insurer',
    emergencyLabel: 'Call 999 if injuries, then your insurer',
    timeLimit: 'Report to insurer within 24-48 hours',
    timeLimitPt: 'Reportar à seguradora em até 24-48 horas',
    documentsNeeded: [
      'Policy number',
      'Photos of damage (all angles)',
      'Other driver\'s details (name, reg, insurer)',
      'Police report number (if applicable)',
      'Dashcam footage',
      'Witness contact details',
    ],
    documentsNeededPt: [
      'Número da apólice',
      'Fotos dos danos (todos os ângulos)',
      'Dados do outro motorista (nome, placa, seguradora)',
      'Número do boletim policial (se aplicável)',
      'Filmagem da dashcam',
      'Dados de testemunhas',
    ],
    steps: [
      { step: 1, title: 'Ensure Safety', titlePt: 'Garanta a Segurança', description: 'Check for injuries. Call 999 if anyone is hurt. Move to a safe location if possible. Turn on hazard lights.', descriptionPt: 'Verifique se há feridos. Ligue 999 se alguém estiver machucado. Mova-se para um local seguro se possível. Ligue os pisca-alertas.', important: true },
      { step: 2, title: 'Document Everything', titlePt: 'Documente Tudo', description: 'Take photos of all damage, the scene, road conditions, and number plates. Note the time, date, and location.', descriptionPt: 'Tire fotos de todos os danos, da cena, condições da estrada e placas. Anote hora, data e local.' },
      { step: 3, title: 'Exchange Details', titlePt: 'Troque Informações', description: 'Get the other driver\'s name, address, phone, registration, and insurer. Never admit fault at the scene.', descriptionPt: 'Obtenha nome, endereço, telefone, placa e seguradora do outro motorista. Nunca admita culpa no local.', important: true },
      { step: 4, title: 'Report to Police', titlePt: 'Reporte à Polícia', description: 'You MUST report to police within 24 hours if: anyone is injured, other driver didn\'t stop, or you didn\'t exchange details.', descriptionPt: 'Você DEVE reportar à polícia em 24 horas se: alguém ficou ferido, o outro motorista não parou, ou vocês não trocaram informações.' },
      { step: 5, title: 'Call Your Insurer', titlePt: 'Ligue para sua Seguradora', description: 'Report the incident to your insurer as soon as possible. Have your policy number ready. They will assign a claim reference.', descriptionPt: 'Reporte o incidente à sua seguradora o mais rápido possível. Tenha o número da apólice em mãos. Eles atribuirão uma referência de sinistro.' },
      { step: 6, title: 'Get Repairs', titlePt: 'Obtenha Reparos', description: 'Your insurer will guide you to approved repairers or you can choose your own. Get at least 2 quotes if using your own.', descriptionPt: 'Sua seguradora vai indicar oficinas aprovadas ou você pode escolher a sua. Obtenha pelo menos 2 orçamentos se for sua escolha.' },
      { step: 7, title: 'Courtesy Car', titlePt: 'Carro Reserva', description: 'Check if your policy includes a courtesy car. If not at fault, the other party\'s insurer may provide one.', descriptionPt: 'Verifique se sua apólice inclui carro reserva. Se não tiver culpa, a seguradora do outro pode fornecer um.' },
    ],
    tips: [
      'Never admit liability at the scene — let insurers decide',
      'Keep all receipts for expenses related to the accident (taxis, car hire)',
      'If not at fault, you may be able to claim back your excess',
      'Dashcam footage can be crucial — save it immediately',
      'Your NCD (No Claims Discount) may be affected even if not at fault',
    ],
    tipsPt: [
      'Nunca admita culpa no local — deixe as seguradoras decidirem',
      'Guarde todos os recibos de despesas relacionadas ao acidente (táxis, aluguel de carro)',
      'Se não tiver culpa, você pode recuperar o valor do excesso',
      'Filmagem da dashcam pode ser crucial — salve imediatamente',
      'Seu NCD (Bônus) pode ser afetado mesmo sem culpa',
    ],
  },

  motorcycle: {
    type: 'motorcycle',
    title: 'Motorcycle Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro de Moto',
    emergencyNumber: '999 (emergency) or insurer',
    emergencyLabel: 'Call 999 if injuries, then your insurer',
    timeLimit: 'Report to insurer within 24-48 hours',
    timeLimitPt: 'Reportar à seguradora em até 24-48 horas',
    documentsNeeded: [
      'Policy number',
      'Photos of damage and protective gear',
      'Other party\'s details',
      'Police report number',
      'Medical records if injured',
      'Witness details',
    ],
    documentsNeededPt: [
      'Número da apólice',
      'Fotos dos danos e equipamentos de proteção',
      'Dados da outra parte',
      'Número do boletim policial',
      'Registros médicos se ferido',
      'Dados de testemunhas',
    ],
    steps: [
      { step: 1, title: 'Check for Injuries', titlePt: 'Verifique Ferimentos', description: 'Motorcycle accidents often cause serious injuries. Call 999 immediately if hurt. Do NOT remove your helmet if you suspect neck/spine injury.', descriptionPt: 'Acidentes de moto frequentemente causam ferimentos graves. Ligue 999 imediatamente se ferido. NÃO remova o capacete se suspeitar de lesão no pescoço/coluna.', important: true },
      { step: 2, title: 'Secure the Scene', titlePt: 'Proteja o Local', description: 'Move the motorcycle off the road if safe. Take photos of everything — damage, road conditions, helmet damage, protective gear.', descriptionPt: 'Mova a moto para fora da estrada se seguro. Tire fotos de tudo — danos, condições da estrada, danos no capacete, equipamento de proteção.' },
      { step: 3, title: 'Exchange & Report', titlePt: 'Troque Informações', description: 'Exchange details with other parties. Report to police within 24h if injuries or failure to stop.', descriptionPt: 'Troque informações com as outras partes. Reporte à polícia em 24h se houver ferimentos ou fuga.' },
      { step: 4, title: 'Medical Assessment', titlePt: 'Avaliação Médica', description: 'Even if you feel fine, get checked. Adrenaline can mask injuries. Keep all medical records for the claim.', descriptionPt: 'Mesmo se sentir bem, faça um check-up. A adrenalina pode mascarar ferimentos. Guarde todos os registros médicos para o sinistro.', important: true },
      { step: 5, title: 'Contact Insurer', titlePt: 'Contate a Seguradora', description: 'Call your insurer with policy number and full details. Mention any protective gear worn (can support claim).', descriptionPt: 'Ligue para sua seguradora com o número da apólice e detalhes completos. Mencione equipamentos de proteção usados (pode apoiar o sinistro).' },
      { step: 6, title: 'Repair or Write-off', titlePt: 'Reparo ou Perda Total', description: 'The insurer will assess if the bike can be repaired or is a write-off. Get independent valuation if you disagree.', descriptionPt: 'A seguradora avaliará se a moto pode ser reparada ou é perda total. Obtenha avaliação independente se discordar.' },
    ],
    tips: [
      'Photograph your helmet and gear damage — you can claim replacement costs',
      'Keep receipts for replacement gear if damaged in the accident',
      'If the accident was due to road defects, you may also claim against the local council',
      'Consider personal injury solicitors for serious injuries (no win, no fee)',
    ],
    tipsPt: [
      'Fotografe danos no capacete e equipamento — você pode solicitar custos de reposição',
      'Guarde recibos de equipamentos de reposição se danificados no acidente',
      'Se o acidente foi por defeitos na estrada, você pode processar o conselho local',
      'Considere advogados de lesão pessoal para ferimentos graves (no win, no fee)',
    ],
  },

  home: {
    type: 'home',
    title: 'Home Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro Residencial',
    emergencyNumber: '999 (fire/flood) or insurer emergency line',
    emergencyLabel: 'Call 999 for fire/flood, then your insurer',
    timeLimit: 'Report to insurer as soon as possible (within 24-48h)',
    timeLimitPt: 'Reportar à seguradora o mais rápido possível (em 24-48h)',
    documentsNeeded: [
      'Policy number',
      'Photos/video of ALL damage',
      'Receipts or proof of value for damaged items',
      'Police crime reference (if theft/vandalism)',
      'Repair/replacement quotes',
      'Emergency service reports (fire brigade)',
    ],
    documentsNeededPt: [
      'Número da apólice',
      'Fotos/vídeo de TODOS os danos',
      'Recibos ou comprovantes de valor dos itens danificados',
      'Referência policial (se roubo/vandalismo)',
      'Orçamentos de reparo/substituição',
      'Relatórios de serviços de emergência (bombeiros)',
    ],
    steps: [
      { step: 1, title: 'Prevent Further Damage', titlePt: 'Previna Mais Danos', description: 'Make temporary repairs to prevent further damage (cover broken windows, turn off water). Keep receipts — these are claimable.', descriptionPt: 'Faça reparos temporários para prevenir mais danos (cubra janelas quebradas, feche o registro). Guarde recibos — são reembolsáveis.', important: true },
      { step: 2, title: 'Document Everything', titlePt: 'Documente Tudo', description: 'Photograph and video ALL damage before cleaning up. List every damaged/stolen item with approximate value and purchase date.', descriptionPt: 'Fotografe e filme TODOS os danos antes de limpar. Liste cada item danificado/roubado com valor aproximado e data de compra.' },
      { step: 3, title: 'Report Crime (if applicable)', titlePt: 'Registre Ocorrência (se aplicável)', description: 'For theft, break-in, or vandalism: call 101 (non-emergency police) and get a crime reference number. This is essential for the claim.', descriptionPt: 'Para roubo, arrombamento ou vandalismo: ligue 101 (polícia não-emergencial) e obtenha um número de referência. Isto é essencial para o sinistro.' },
      { step: 4, title: 'Call Your Insurer', titlePt: 'Ligue para a Seguradora', description: 'Report the claim with your policy number. They may send a loss adjuster to assess the damage. Ask about emergency accommodation if your home is uninhabitable.', descriptionPt: 'Reporte o sinistro com seu número de apólice. Eles podem enviar um avaliador de perdas. Pergunte sobre acomodação de emergência se sua casa estiver inabitável.' },
      { step: 5, title: 'Get Quotes', titlePt: 'Obtenha Orçamentos', description: 'Get at least 2 repair quotes from qualified tradespeople. Your insurer may have preferred suppliers.', descriptionPt: 'Obtenha pelo menos 2 orçamentos de profissionais qualificados. Sua seguradora pode ter fornecedores preferenciais.' },
      { step: 6, title: 'Keep Records', titlePt: 'Mantenha Registros', description: 'Keep a diary of all communications, receipts, and expenses. This includes temporary accommodation, meals out, and emergency repairs.', descriptionPt: 'Mantenha um diário de todas as comunicações, recibos e despesas. Inclui acomodação temporária, refeições fora e reparos de emergência.' },
    ],
    tips: [
      'Buildings insurance covers structure; Contents covers your belongings — check which you have',
      'Alternative accommodation costs are usually covered if your home is uninhabitable',
      'Keep receipts for ALL expenses related to the incident (meals, hotel, emergency repairs)',
      'If you disagree with the insurer\'s valuation, you can appoint your own loss adjuster',
      'Don\'t throw away damaged items until the insurer says you can',
    ],
    tipsPt: [
      'Seguro de estrutura cobre a construção; Seguro de conteúdo cobre seus pertences — verifique qual você tem',
      'Custos de acomodação alternativa geralmente são cobertos se sua casa estiver inabitável',
      'Guarde recibos de TODAS as despesas relacionadas ao incidente (refeições, hotel, reparos de emergência)',
      'Se discordar da avaliação da seguradora, você pode contratar seu próprio avaliador',
      'Não jogue fora itens danificados até a seguradora autorizar',
    ],
  },

  life: {
    type: 'life',
    title: 'Life Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro de Vida',
    emergencyNumber: 'Insurer claims line',
    emergencyLabel: 'Contact insurer claims department',
    timeLimit: 'No strict time limit, but claim as soon as practical',
    timeLimitPt: 'Sem limite rígido, mas faça o sinistro assim que possível',
    documentsNeeded: [
      'Policy number and documents',
      'Death certificate (original or certified copy)',
      'Claimant\'s ID (passport or driving licence)',
      'Proof of relationship to deceased',
      'Grant of Probate or Letters of Administration',
      'Medical certificate of cause of death',
    ],
    documentsNeededPt: [
      'Número da apólice e documentos',
      'Certidão de óbito (original ou cópia autenticada)',
      'ID do reclamante (passaporte ou carteira de motorista)',
      'Comprovante de parentesco com o falecido',
      'Concessão de Inventário ou Cartas de Administração',
      'Atestado médico de causa da morte',
    ],
    steps: [
      { step: 1, title: 'Locate the Policy', titlePt: 'Localize a Apólice', description: 'Find the policy document. Check if it\'s held in trust (if so, proceeds go directly to named beneficiaries, bypassing probate).', descriptionPt: 'Encontre o documento da apólice. Verifique se está em trust (se sim, o valor vai diretamente aos beneficiários nomeados, sem inventário).' },
      { step: 2, title: 'Obtain Death Certificate', titlePt: 'Obtenha Certidão de Óbito', description: 'Register the death and obtain the death certificate. You\'ll need multiple certified copies for different claims.', descriptionPt: 'Registre o óbito e obtenha a certidão. Você precisará de várias cópias autenticadas para diferentes sinistros.' },
      { step: 3, title: 'Contact the Insurer', titlePt: 'Contate a Seguradora', description: 'Call the insurer\'s claims line. They will send you a claim form and list of required documents. Most insurers have bereavement specialists.', descriptionPt: 'Ligue para a linha de sinistros da seguradora. Eles enviarão formulário e lista de documentos necessários. A maioria tem especialistas em luto.', important: true },
      { step: 4, title: 'Submit Documents', titlePt: 'Envie Documentos', description: 'Complete the claim form and submit with all required documents. The insurer may request medical records from the deceased\'s GP.', descriptionPt: 'Complete o formulário e envie com todos os documentos necessários. A seguradora pode solicitar registros médicos do GP do falecido.' },
      { step: 5, title: 'Await Assessment', titlePt: 'Aguarde Avaliação', description: 'The insurer will verify the claim. This typically takes 2-8 weeks. They may investigate if death occurred within the first 1-2 years of the policy.', descriptionPt: 'A seguradora verificará o sinistro. Normalmente leva 2-8 semanas. Podem investigar se o óbito ocorreu nos primeiros 1-2 anos da apólice.' },
      { step: 6, title: 'Receive Payment', titlePt: 'Receba o Pagamento', description: 'Once approved, payment is made to the beneficiary (if in trust) or the estate. Consider financial advice on how to manage the lump sum.', descriptionPt: 'Uma vez aprovado, o pagamento é feito ao beneficiário (se em trust) ou ao espólio. Considere aconselhamento financeiro sobre como gerenciar o valor.' },
    ],
    tips: [
      'If the policy was written in trust, the payout bypasses probate and inheritance tax',
      'Check if the deceased had life insurance through their employer (group life scheme)',
      'Most policies have a contestability period (usually 1-2 years) — claims within this period may be investigated more thoroughly',
      'Bereavement support services are often included with life insurance policies',
      'Check for any other policies: mortgage protection, critical illness, income protection',
    ],
    tipsPt: [
      'Se a apólice estava em trust, o pagamento não passa por inventário nem imposto sobre herança',
      'Verifique se o falecido tinha seguro de vida pelo empregador (esquema de grupo)',
      'A maioria das apólices tem período de contestação (geralmente 1-2 anos) — sinistros neste período são investigados mais detalhadamente',
      'Serviços de apoio ao luto geralmente estão incluídos nas apólices de vida',
      'Verifique outras apólices: proteção hipotecária, doença crítica, proteção de renda',
    ],
  },

  health: {
    type: 'health',
    title: 'Health Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro Saúde',
    emergencyNumber: '999 (emergency) or insurer pre-auth line',
    emergencyLabel: 'For emergencies call 999, then insurer for pre-authorisation',
    timeLimit: 'Pre-authorise before treatment when possible',
    timeLimitPt: 'Pré-autorize antes do tratamento quando possível',
    documentsNeeded: [
      'Policy number',
      'GP referral letter',
      'Consultant/specialist details',
      'Treatment plan and costs',
      'Medical reports',
      'Receipts for treatment',
    ],
    documentsNeededPt: [
      'Número da apólice',
      'Carta de encaminhamento do GP',
      'Dados do consultor/especialista',
      'Plano de tratamento e custos',
      'Relatórios médicos',
      'Recibos do tratamento',
    ],
    steps: [
      { step: 1, title: 'Check Coverage', titlePt: 'Verifique a Cobertura', description: 'Before booking treatment, check your policy covers the condition and treatment type. Some conditions have waiting periods.', descriptionPt: 'Antes de agendar tratamento, verifique se sua apólice cobre a condição e tipo de tratamento. Algumas condições têm períodos de carência.' },
      { step: 2, title: 'Get GP Referral', titlePt: 'Obtenha Encaminhamento do GP', description: 'Most policies require a GP referral before seeing a specialist. Book an appointment with your GP first.', descriptionPt: 'A maioria das apólices exige encaminhamento do GP antes de ver um especialista. Marque consulta com seu GP primeiro.', important: true },
      { step: 3, title: 'Pre-authorise', titlePt: 'Pré-autorize', description: 'Call your insurer to pre-authorise the treatment BEFORE going ahead. This is crucial — without it, you may not be covered.', descriptionPt: 'Ligue para sua seguradora para pré-autorizar o tratamento ANTES de prosseguir. Isto é crucial — sem isso, pode não ser coberto.', important: true },
      { step: 4, title: 'Choose Provider', titlePt: 'Escolha o Provedor', description: 'Use an insurer-approved hospital or specialist for direct billing. You may be out of pocket if you choose non-approved providers.', descriptionPt: 'Use hospital ou especialista aprovado pela seguradora para faturamento direto. Você pode pagar do bolso se escolher provedores não aprovados.' },
      { step: 5, title: 'Attend Treatment', titlePt: 'Realize o Tratamento', description: 'Show your membership card/number at the hospital. The provider will bill the insurer directly if pre-approved.', descriptionPt: 'Apresente seu cartão/número de associado no hospital. O provedor faturará diretamente à seguradora se pré-aprovado.' },
      { step: 6, title: 'Submit Receipts', titlePt: 'Envie Recibos', description: 'If you paid upfront, submit receipts and the claim form for reimbursement. Keep copies of everything.', descriptionPt: 'Se pagou adiantado, envie recibos e formulário para reembolso. Guarde cópias de tudo.' },
    ],
    tips: [
      'Always pre-authorise — claims without pre-authorisation are frequently rejected',
      'Check if your policy has an excess — you may need to pay the first £100-£500',
      'Mental health and dental are often excluded or limited — check your policy',
      'Keep your GP involved — they coordinate your NHS and private care',
    ],
    tipsPt: [
      'Sempre pré-autorize — sinistros sem pré-autorização são frequentemente rejeitados',
      'Verifique se sua apólice tem franquia — você pode precisar pagar os primeiros £100-£500',
      'Saúde mental e dental geralmente são excluídos ou limitados — verifique sua apólice',
      'Mantenha seu GP envolvido — ele coordena seu cuidado no NHS e privado',
    ],
  },

  travel: {
    type: 'travel',
    title: 'Travel Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro Viagem',
    emergencyNumber: 'Insurer 24h emergency assistance line',
    emergencyLabel: 'Call the 24h emergency line on your policy',
    timeLimit: 'Report within 31 days of returning (varies by insurer)',
    timeLimitPt: 'Reporte em até 31 dias após retorno (varia por seguradora)',
    documentsNeeded: [
      'Policy number and travel dates',
      'Receipts for expenses (medical, accommodation, transport)',
      'Police report (for theft)',
      'Medical reports and prescriptions',
      'Flight delay/cancellation confirmation from airline',
      'Proof of original booking costs',
    ],
    documentsNeededPt: [
      'Número da apólice e datas de viagem',
      'Recibos de despesas (médicas, hospedagem, transporte)',
      'Boletim policial (para roubo)',
      'Relatórios médicos e receitas',
      'Confirmação de atraso/cancelamento da companhia aérea',
      'Comprovante dos custos originais da reserva',
    ],
    steps: [
      { step: 1, title: 'Call Emergency Line', titlePt: 'Ligue para Emergência', description: 'For medical emergencies abroad, call the 24h assistance number on your policy card BEFORE going to hospital. They can direct you and arrange direct billing.', descriptionPt: 'Para emergências médicas no exterior, ligue para o número 24h no cartão da apólice ANTES de ir ao hospital. Eles podem orientá-lo e arranjar faturamento direto.', important: true },
      { step: 2, title: 'Get Documentation', titlePt: 'Obtenha Documentação', description: 'Get police reports for theft, medical reports for illness/injury, airline confirmation for delays/cancellations. Document everything with photos.', descriptionPt: 'Obtenha boletins policiais para roubo, relatórios médicos para doença/ferimento, confirmação da companhia aérea para atrasos/cancelamentos. Documente tudo com fotos.' },
      { step: 3, title: 'Keep All Receipts', titlePt: 'Guarde Todos os Recibos', description: 'Keep receipts for ALL expenses: medicine, hospital, hotels, food, phone calls, transport. These are all potentially claimable.', descriptionPt: 'Guarde recibos de TODAS as despesas: remédios, hospital, hotéis, alimentação, ligações, transporte. Tudo potencialmente reembolsável.' },
      { step: 4, title: 'Submit Claim on Return', titlePt: 'Envie o Sinistro ao Retornar', description: 'Complete the claim form and submit all documents. Most insurers have online claim portals now.', descriptionPt: 'Complete o formulário e envie todos os documentos. A maioria das seguradoras tem portais de sinistro online agora.' },
    ],
    tips: [
      'EHIC/GHIC card works alongside travel insurance in Europe — carry both',
      'Declare pre-existing medical conditions when buying the policy',
      'Flight delay claims usually kick in after 12+ hours delay',
      'Baggage claims need proof of value — keep purchase receipts for expensive items you travel with',
    ],
    tipsPt: [
      'Cartão EHIC/GHIC funciona junto com seguro viagem na Europa — leve ambos',
      'Declare condições médicas pré-existentes ao comprar a apólice',
      'Sinistros de atraso de voo geralmente começam após 12+ horas de atraso',
      'Sinistros de bagagem precisam de comprovante de valor — guarde recibos de itens caros que leva em viagens',
    ],
  },

  pet: {
    type: 'pet',
    title: 'Pet Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro Pet',
    emergencyNumber: 'Emergency vet, then insurer',
    emergencyLabel: 'Treat your pet first, then call insurer',
    timeLimit: 'Submit claim within 90 days of treatment',
    timeLimitPt: 'Envie o sinistro em até 90 dias após o tratamento',
    documentsNeeded: [
      'Policy number',
      'Vet invoice and receipts',
      'Clinical notes from vet',
      'Pet\'s medical history',
    ],
    documentsNeededPt: [
      'Número da apólice',
      'Fatura e recibos do veterinário',
      'Notas clínicas do veterinário',
      'Histórico médico do pet',
    ],
    steps: [
      { step: 1, title: 'Get Veterinary Treatment', titlePt: 'Obtenha Tratamento Veterinário', description: 'Your pet\'s health comes first. Seek treatment immediately. You don\'t need pre-authorisation for emergencies.', descriptionPt: 'A saúde do seu pet vem primeiro. Procure tratamento imediatamente. Não precisa de pré-autorização para emergências.', important: true },
      { step: 2, title: 'Pay the Vet', titlePt: 'Pague o Veterinário', description: 'Most vets require upfront payment. Some can claim direct from your insurer — ask. Keep all receipts and invoices.', descriptionPt: 'A maioria dos veterinários exige pagamento antecipado. Alguns podem cobrar direto da seguradora — pergunte. Guarde todos os recibos e faturas.' },
      { step: 3, title: 'Submit Claim', titlePt: 'Envie o Sinistro', description: 'Complete the claim form. The vet may need to fill in the clinical section. Submit receipts, clinical notes, and treatment details.', descriptionPt: 'Complete o formulário de sinistro. O veterinário pode precisar preencher a seção clínica. Envie recibos, notas clínicas e detalhes do tratamento.' },
      { step: 4, title: 'Await Reimbursement', titlePt: 'Aguarde Reembolso', description: 'The insurer will assess and reimburse minus your excess. Typical processing time is 5-10 working days.', descriptionPt: 'A seguradora avaliará e reembolsará menos sua franquia. Tempo típico de processamento é 5-10 dias úteis.' },
    ],
    tips: [
      'Pre-existing conditions are usually excluded — declare everything when taking out the policy',
      'Lifetime policies are best for chronic conditions; per-condition policies reset annually',
      'Dental and routine treatments (vaccinations, flea treatment) are usually NOT covered',
      'Keep your pet\'s vaccination records up to date — non-compliance can void claims',
    ],
    tipsPt: [
      'Condições pré-existentes geralmente são excluídas — declare tudo ao contratar',
      'Apólices vitalícias são melhores para condições crônicas; por condição são resetadas anualmente',
      'Tratamentos dentais e de rotina (vacinação, antipulgas) geralmente NÃO são cobertos',
      'Mantenha registros de vacinação do pet atualizados — não-cumprimento pode anular sinistros',
    ],
  },

  business: {
    type: 'business',
    title: 'Business Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro Empresarial',
    emergencyNumber: 'Insurer business claims line',
    emergencyLabel: 'Call your business insurance claims line',
    timeLimit: 'Report as soon as possible, ideally within 24 hours',
    timeLimitPt: 'Reporte o mais rápido possível, idealmente em 24 horas',
    documentsNeeded: [
      'Policy number',
      'Detailed description of the incident',
      'Financial records showing loss',
      'Photos/evidence of damage',
      'Third-party claim details (if liability)',
      'Police report (if theft/criminal damage)',
    ],
    documentsNeededPt: [
      'Número da apólice',
      'Descrição detalhada do incidente',
      'Registros financeiros mostrando a perda',
      'Fotos/evidência dos danos',
      'Detalhes do sinistro de terceiros (se responsabilidade)',
      'Boletim policial (se roubo/dano criminal)',
    ],
    steps: [
      { step: 1, title: 'Mitigate Losses', titlePt: 'Minimize Perdas', description: 'Take reasonable steps to prevent further loss or damage. This is a policy requirement. Document all actions taken.', descriptionPt: 'Tome medidas razoáveis para prevenir mais perdas ou danos. Isto é uma exigência da apólice. Documente todas as ações tomadas.', important: true },
      { step: 2, title: 'Report Immediately', titlePt: 'Reporte Imediatamente', description: 'Contact your insurer\'s business claims line. For public liability claims, do NOT admit liability.', descriptionPt: 'Contate a linha de sinistros empresariais da seguradora. Para sinistros de responsabilidade pública, NÃO admita culpa.' },
      { step: 3, title: 'Document Everything', titlePt: 'Documente Tudo', description: 'Gather all evidence: photos, CCTV, financial records, invoices, contracts. The more evidence, the smoother the claim.', descriptionPt: 'Reúna todas as evidências: fotos, CCTV, registros financeiros, faturas, contratos. Mais evidência = sinistro mais suave.' },
      { step: 4, title: 'Work with Loss Adjuster', titlePt: 'Trabalhe com o Avaliador', description: 'For larger claims, the insurer will send a loss adjuster. Cooperate fully and provide all requested documentation.', descriptionPt: 'Para sinistros maiores, a seguradora enviará um avaliador de perdas. Coopere totalmente e forneça toda documentação solicitada.' },
    ],
    tips: [
      'Business interruption insurance covers lost income — keep detailed revenue records',
      'Public liability and employer\'s liability are separate — make sure you have both',
      'Professional indemnity covers advice/services errors — essential for consultants',
      'Cyber insurance is increasingly important — check if your policy covers data breaches',
    ],
    tipsPt: [
      'Seguro de interrupção de negócios cobre renda perdida — mantenha registros detalhados de receita',
      'Responsabilidade pública e responsabilidade do empregador são separadas — certifique-se de ter ambas',
      'Indenização profissional cobre erros em conselhos/serviços — essencial para consultores',
      'Seguro cibernético é cada vez mais importante — verifique se sua apólice cobre violações de dados',
    ],
  },

  other: {
    type: 'other',
    title: 'General Insurance Claim Guide',
    titlePt: 'Guia de Sinistro — Seguro Geral',
    emergencyNumber: 'Your insurer claims line',
    emergencyLabel: 'Contact your insurer',
    timeLimit: 'Report as soon as possible',
    timeLimitPt: 'Reporte o mais rápido possível',
    documentsNeeded: [
      'Policy number and documents',
      'Evidence of the incident',
      'Receipts and valuations',
      'Police report (if applicable)',
    ],
    documentsNeededPt: [
      'Número da apólice e documentos',
      'Evidência do incidente',
      'Recibos e avaliações',
      'Boletim policial (se aplicável)',
    ],
    steps: [
      { step: 1, title: 'Read Your Policy', titlePt: 'Leia sua Apólice', description: 'Check what is and isn\'t covered. Note the excess amount and any conditions or exclusions.', descriptionPt: 'Verifique o que é e o que não é coberto. Observe o valor da franquia e quaisquer condições ou exclusões.' },
      { step: 2, title: 'Document the Incident', titlePt: 'Documente o Incidente', description: 'Gather all evidence: photos, receipts, reports, witness statements.', descriptionPt: 'Reúna todas as evidências: fotos, recibos, relatórios, depoimentos de testemunhas.' },
      { step: 3, title: 'Contact Your Insurer', titlePt: 'Contate sua Seguradora', description: 'Call the claims line and report with your policy number and full details of the incident.', descriptionPt: 'Ligue para a linha de sinistros e reporte com seu número de apólice e detalhes completos do incidente.' },
      { step: 4, title: 'Follow Up', titlePt: 'Acompanhe', description: 'Keep track of your claim reference, all communications, and expected timelines.', descriptionPt: 'Acompanhe a referência do sinistro, todas as comunicações e prazos esperados.' },
    ],
    tips: [
      'Always report promptly — delays can result in claim rejection',
      'Keep copies of ALL documents you send to the insurer',
      'If your claim is rejected, you can complain to the Financial Ombudsman Service (free)',
    ],
    tipsPt: [
      'Sempre reporte prontamente — atrasos podem resultar em rejeição do sinistro',
      'Guarde cópias de TODOS os documentos que enviar à seguradora',
      'Se o sinistro for rejeitado, você pode reclamar ao Financial Ombudsman Service (grátis)',
    ],
  },
};

// ─── COMPARISON LINKS ────────────────────────────────────────

export const COMPARISON_LINKS: ComparisonLink[] = [
  { name: 'Compare the Market', url: 'https://www.comparethemarket.com', types: ['car', 'motorcycle', 'home', 'life', 'travel', 'pet'] },
  { name: 'GoCompare', url: 'https://www.gocompare.com', types: ['car', 'motorcycle', 'home', 'life', 'travel'] },
  { name: 'MoneySupermarket', url: 'https://www.moneysupermarket.com', types: ['car', 'motorcycle', 'home', 'life', 'travel'] },
  { name: 'Confused.com', url: 'https://www.confused.com', types: ['car', 'motorcycle', 'home', 'travel'] },
  { name: 'uSwitch', url: 'https://www.uswitch.com', types: ['car', 'home', 'life', 'health'] },
  { name: 'MoneySavingExpert', url: 'https://www.moneysavingexpert.com/insurance/', types: ['car', 'motorcycle', 'home', 'life', 'travel', 'pet', 'health'] },
];

// ─── UK MARKET PRICE RANGES (ABI / public data) ─────────────

export const UK_PRICE_RANGES: Record<string, PriceRange> = {
  car: {
    type: 'car',
    monthlyLow: 25,
    monthlyHigh: 120,
    factors: ['Age', 'Location', 'Vehicle type', 'NCD years', 'Cover type', 'Annual mileage', 'Parking', 'Driving history'],
    factorsPt: ['Idade', 'Localização', 'Tipo de veículo', 'Anos de NCD', 'Tipo de cobertura', 'Quilometragem anual', 'Estacionamento', 'Histórico de condução'],
  },
  motorcycle: {
    type: 'motorcycle',
    monthlyLow: 20,
    monthlyHigh: 100,
    factors: ['Engine size (cc)', 'Rider age', 'Experience', 'Security (tracker, lock)', 'Storage', 'Usage'],
    factorsPt: ['Cilindrada (cc)', 'Idade do piloto', 'Experiência', 'Segurança (rastreador, trava)', 'Armazenamento', 'Uso'],
  },
  life: {
    type: 'life',
    monthlyLow: 5,
    monthlyHigh: 80,
    factors: ['Age', 'Health', 'Smoker/non-smoker', 'Coverage amount', 'Term length', 'Family medical history'],
    factorsPt: ['Idade', 'Saúde', 'Fumante/não-fumante', 'Valor da cobertura', 'Prazo', 'Histórico médico familiar'],
  },
  home: {
    type: 'home',
    monthlyLow: 10,
    monthlyHigh: 60,
    factors: ['Property type', 'Location', 'Rebuild value', 'Contents value', 'Claims history', 'Security'],
    factorsPt: ['Tipo de imóvel', 'Localização', 'Valor de reconstrução', 'Valor do conteúdo', 'Histórico de sinistros', 'Segurança'],
  },
  health: {
    type: 'health',
    monthlyLow: 30,
    monthlyHigh: 200,
    factors: ['Age', 'Cover level', 'Excess', 'Hospital list', 'Pre-existing conditions', 'Outpatient cover'],
    factorsPt: ['Idade', 'Nível de cobertura', 'Franquia', 'Lista de hospitais', 'Condições pré-existentes', 'Cobertura ambulatorial'],
  },
  travel: {
    type: 'travel',
    monthlyLow: 3,
    monthlyHigh: 30,
    factors: ['Destination', 'Trip length', 'Age', 'Medical conditions', 'Activities', 'Single trip vs annual'],
    factorsPt: ['Destino', 'Duração', 'Idade', 'Condições médicas', 'Atividades', 'Viagem única vs anual'],
  },
  pet: {
    type: 'pet',
    monthlyLow: 10,
    monthlyHigh: 80,
    factors: ['Pet type', 'Breed', 'Age', 'Cover level (lifetime vs per-condition)', 'Vet fee limit'],
    factorsPt: ['Tipo de pet', 'Raça', 'Idade', 'Nível de cobertura (vitalício vs por condição)', 'Limite de honorários veterinários'],
  },
  business: {
    type: 'business',
    monthlyLow: 15,
    monthlyHigh: 300,
    factors: ['Business type', 'Revenue', 'Number of employees', 'Cover types needed', 'Claims history', 'Industry risk'],
    factorsPt: ['Tipo de negócio', 'Receita', 'Número de funcionários', 'Tipos de cobertura necessários', 'Histórico de sinistros', 'Risco do setor'],
  },
};

// ─── RENEWAL TIPS ────────────────────────────────────────────

export const RENEWAL_TIPS = {
  general: [
    'Never auto-renew without checking — prices typically increase 10-30% on auto-renewal',
    'Start comparing prices 3-4 weeks before your renewal date',
    'Call your current insurer with the best quote you found — they often match it',
    'Check if you can increase your voluntary excess to reduce premiums',
    'Multi-policy discounts: insure car + home with the same provider for savings',
    'Pay annually if you can — monthly payments usually cost 15-20% more in total',
  ],
  generalPt: [
    'Nunca aceite renovação automática sem verificar — preços geralmente aumentam 10-30% na auto-renovação',
    'Comece a comparar preços 3-4 semanas antes da data de renovação',
    'Ligue para sua seguradora atual com a melhor cotação que encontrou — eles geralmente cobrem',
    'Verifique se pode aumentar sua franquia voluntária para reduzir prêmios',
    'Desconto multi-apólice: segure carro + casa com o mesmo provedor para economizar',
    'Pague anualmente se puder — pagamentos mensais geralmente custam 15-20% mais no total',
  ],
};

// ─── HELPER ──────────────────────────────────────────────────

export function getClaimGuide(type: string): ClaimGuide {
  return CLAIMS_GUIDES[type] || CLAIMS_GUIDES.other;
}

export function getComparisonLinks(type: string): ComparisonLink[] {
  return COMPARISON_LINKS.filter(link => link.types.includes(type));
}

export function getPriceRange(type: string): PriceRange | null {
  return UK_PRICE_RANGES[type] || null;
}

export function getPriceAssessment(type: string, monthlyPremium: number): { status: 'low' | 'typical' | 'high'; message: string; messagePt: string } {
  const range = UK_PRICE_RANGES[type];
  if (!range) return { status: 'typical', message: 'Unable to assess — no market data for this type', messagePt: 'Impossível avaliar — sem dados de mercado para este tipo' };

  if (monthlyPremium < range.monthlyLow) {
    return { status: 'low', message: `Your premium (£${monthlyPremium.toFixed(0)}/mo) is below the typical UK range (£${range.monthlyLow}-£${range.monthlyHigh}/mo). Great deal — but check your cover is adequate!`, messagePt: `Seu prêmio (£${monthlyPremium.toFixed(0)}/mês) está abaixo da faixa típica UK (£${range.monthlyLow}-£${range.monthlyHigh}/mês). Ótimo negócio — mas verifique se sua cobertura é adequada!` };
  } else if (monthlyPremium > range.monthlyHigh) {
    return { status: 'high', message: `Your premium (£${monthlyPremium.toFixed(0)}/mo) is above the typical UK range (£${range.monthlyLow}-£${range.monthlyHigh}/mo). Consider comparing prices before renewal.`, messagePt: `Seu prêmio (£${monthlyPremium.toFixed(0)}/mês) está acima da faixa típica UK (£${range.monthlyLow}-£${range.monthlyHigh}/mês). Considere comparar preços antes da renovação.` };
  }
  return { status: 'typical', message: `Your premium (£${monthlyPremium.toFixed(0)}/mo) is within the typical UK range (£${range.monthlyLow}-£${range.monthlyHigh}/mo).`, messagePt: `Seu prêmio (£${monthlyPremium.toFixed(0)}/mês) está dentro da faixa típica UK (£${range.monthlyLow}-£${range.monthlyHigh}/mês).` };
}
