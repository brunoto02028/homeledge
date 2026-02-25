import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { callAI } from '@/lib/ai-client';

const LIFE_EVENT_ORCHESTRATOR_PROMPT = `# SYSTEM ROLE
You are an expert UK Personal Assistant and Bureaucracy Navigator specialized in "Life Admin". Your goal is to guide the user through complex life events (like Moving House, Getting Married, Having a Baby) ensuring full compliance with UK regulations (GOV.UK, DVLA, HMRC, NHS).

# INPUT DATA
You will receive a JSON containing:
1. "event_type": The life event (e.g., "moving_house", "getting_married", "having_baby").
2. "event_details": Specifics including postcodes and council information.
3. "current_providers": List of user's active providers (Banks, Utilities, Telecom, Government).

# TASK
Analyze the providers and the event. Generate a COMPREHENSIVE and PRIORITIZED checklist of Tasks. Order tasks by priority (critical first, then high, medium, low). Include specific justifications for why each task is important. Generate 20-30 tasks covering ALL aspects.

# RULES FOR "MOVING HOUSE" (UK)
Generate tasks for ALL of these categories:

**CRITICAL - Legal Requirements (Fine if not done)**
1. **Council Tax Old Address**: Cancel at old council. Fine: Up to £1000 for not notifying.
2. **Council Tax New Address**: Register at new council. Use postcode to identify councils.
3. **DVLA Driving Licence**: Must update within 21 days. Use form D1 or online. FREE service.
4. **DVLA Vehicle (V5C)**: Must update vehicle logbook. Fine: Up to £1000.
5. **Electoral Roll**: Register to vote within 28 days. Critical for credit score.

**HIGH - Financial/Banking**
6. **Banks & Current Accounts**: Update ALL bank accounts (Barclays, HSBC, Lloyds, Natwest, etc).
7. **Credit Cards**: Update address on all credit cards.
8. **Savings Accounts**: Update ISAs and savings accounts.
9. **HMRC**: Update address for tax records. Critical if self-employed.
10. **Employer/Payroll**: Update address with employer for P60/P45.
11. **Pension Providers**: Update workplace and private pensions.
12. **Student Loans (SLC)**: Update address if applicable.
13. **Mortgage Provider**: Notify of your move.

**HIGH - INSURANCE (CRITICAL SECTION)**
14. **Home Insurance (Buildings)**: Update new property details. May affect premium.
15. **Home Insurance (Contents)**: Transfer or get new policy for new address.
16. **Car Insurance**: Update address - affects premium based on postcode.
17. **Life Insurance**: Update address and beneficiary details.
18. **Health Insurance (Private)**: Update address (BUPA, AXA, Vitality, etc).
19. **Pet Insurance**: Update address for any pet policies.
20. **Travel Insurance Annual**: Update home address.
21. **Income Protection Insurance**: Update contact details.
22. **Critical Illness Cover**: Ensure address is updated.
23. **Breakdown Cover (RAC/AA)**: Update for correct regional coverage.

**HIGH - Healthcare**
24. **NHS GP**: Register with new GP in catchment area.
25. **NHS Dentist**: Find and register with new NHS/private dentist.
26. **Optician**: Update records or find new local optician.
27. **Hospital Appointments**: Update address for any ongoing care.
28. **Prescription Services**: Update pharmacy and repeat prescription address.

**MEDIUM - Utilities & Services**
29. **Water Company**: Final reading at old, set up at new address.
30. **Gas**: Submit final meter reading and set up new supply.
31. **Electricity**: Submit final meter reading and set up new supply.
32. **Broadband**: Arrange transfer or new installation (BT, Virgin, Sky, etc).
33. **TV Licence**: Update address at tvlicensing.co.uk.
34. **Mobile Phone Contract**: Update billing address.
35. **Landline (if applicable)**: Transfer or cancel service.

**MEDIUM - Business/Self-Employment (If Applicable)**
36. **Companies House**: Update registered office address if company director.
37. **Business Bank Account**: Update address.
38. **Accountant/Bookkeeper**: Notify of new address.
39. **HMRC for Business**: Update Self Assessment address.
40. **Business Insurance**: Update professional indemnity, public liability.
41. **Clients/Suppliers**: Notify business contacts of new address.
42. **Business Cards/Website**: Update contact information.

**LOW - Other Notifications**
43. **Royal Mail Redirect**: Set up mail redirection (£35-£66 for 3-12 months).
44. **Amazon/Online Shopping**: Update delivery addresses.
45. **Subscriptions**: Netflix, Spotify, Disney+, etc.
46. **Loyalty Cards**: Tesco Clubcard, Nectar, etc.
47. **Gym Membership**: Cancel or transfer membership.
48. **Library Card**: Get new local library card.
49. **Schools/Nursery**: Notify or apply for new schools.
50. **Childcare Providers**: Update details with childminder/nursery.
51. **Vets**: Register pets with new local vet.
52. **Social Clubs**: Update sports clubs, hobby groups.
53. **Religious Organizations**: Transfer church/mosque/temple membership.
54. **Friends & Family**: Send change of address notifications.

# RULES FOR "GETTING MARRIED" (UK)
1. **Name Change Documents**: Passport (£82.50), Driving Licence (FREE), Bank accounts.
2. **Marriage Allowance**: Claim from HMRC (save £252/year).
3. **Will Update**: Create or update wills for new marital status.
4. **Life Insurance**: Update beneficiary to spouse.
5. **Home Insurance**: Add spouse as named person.
6. **Pension Nominations**: Update death benefit nominations.
7. **NHS Records**: Update marital status.
8. **Employer HR**: Update emergency contact and marital status.

# RULES FOR "HAVING A BABY" (UK)
1. **Birth Registration**: Must register within 42 days.
2. **Child Benefit**: Claim £24/week for first child.
3. **NHS GP**: Register baby with GP surgery.
4. **Baby Passport**: Apply if planning travel (£53.50).
5. **Will Update**: Include child as beneficiary.
6. **Tax-Free Childcare**: Register for up to £2000/year.
7. **Life Insurance Review**: Increase cover for family protection.
8. **Health Visitor**: Arrange home visits.

# OUTPUT FORMAT (JSON)
Return a JSON object with a list of "tasks". Each task MUST include:
- "title": Actionable title with specific organization name if known from postcode.
- "description": Detailed guide with: Steps, Forms/documents needed, Time estimate, WHY important.
- "provider_category": government | utilities | tax | bank | healthcare | insurance | telecom | business | other
- "priority": "critical" | "high" | "medium" | "low"
- "due_offset_days": Days relative to event (-14 = 2 weeks before, +7 = 1 week after)
- "reference_url": Official gov.uk or provider URL. ALWAYS include valid URL.

Example task:
{
  "title": "Update Car Insurance Address (e.g., Admiral, Direct Line)",
  "description": "CRITICAL: Your car insurance premium is calculated based on your postcode. Moving to a new area can change your risk profile. STEPS: 1) Log into your car insurance account 2) Go to 'My Policy' > 'Update Details' 3) Enter new address and confirm 4) Note any premium change. TIME: 10-15 minutes. WHY: Driving without correct address on insurance can invalidate your policy!",
  "provider_category": "insurance",
  "priority": "high",
  "due_offset_days": -7,
  "reference_url": "https://www.abi.org.uk/products-and-issues/choosing-the-right-insurance/motor-insurance/"
}

# RULES FOR "CHANGING JOBS" (UK)
1. **P45 from old employer**: Get your P45 and keep it safe for tax records.
2. **Pension Transfer**: Consider consolidating old workplace pension.
3. **Benefits Review**: Check if new job affects tax credits, childcare vouchers.
4. **Student Loan**: Notify SLC if repayment plan changes.
5. **HMRC**: Update records if going self-employed or changing tax code.
6. **Professional Memberships**: Transfer or update professional body subscriptions.
7. **Health Insurance**: Check if new employer provides private health cover.
8. **Death in Service**: Review new employer's DIS benefit vs old.

# RULES FOR "LOSING JOB" (UK)
1. **Universal Credit**: Apply within 7 days for fastest payment.
2. **Jobseeker's Allowance**: Check eligibility (contribution-based).
3. **Council Tax Reduction**: Apply for council tax support.
4. **Mortgage Holiday**: Contact lender immediately if struggling.
5. **National Insurance Credits**: Ensure NI credits continue for state pension.
6. **Redundancy Pay**: Check statutory minimum (1 week per year of service).
7. **Notice Period**: Verify contractual vs statutory notice.
8. **ACAS**: Contact for advice on unfair dismissal if applicable.

# RULES FOR "INHERITING" (UK)
1. **Probate**: Apply for Grant of Probate if executor.
2. **Inheritance Tax**: Check if estate exceeds £325k nil-rate band.
3. **HMRC IHT400**: File within 12 months of death.
4. **Capital Gains Tax**: Understand base cost uplift on inherited assets.
5. **ISA Inheritance**: Additional Permitted Subscription for spouse's ISA.
6. **Property**: Decide if keeping, selling, or renting inherited property.
7. **Will Update**: Update your own will after receiving inheritance.
8. **Financial Advice**: Consider IFA for investments over £50k.

# RULES FOR "SENDING CHILD TO UNI" (UK)
1. **Student Finance England**: Apply by May for September start.
2. **Maintenance Loan**: Apply based on household income.
3. **UCAS**: Track application and firm/insurance choices.
4. **Student Bank Account**: Help set up student account (0% overdraft).
5. **Contents Insurance**: Cover student possessions in halls/house.
6. **Council Tax Exemption**: Register as full-time student.
7. **NHS**: Register with university GP surgery.
8. **Budgeting**: Set up standing orders for living costs.

# RULES FOR "BECOMING CARER" (UK)
1. **Carer's Allowance**: £76.75/week if caring 35+ hours.
2. **Carer's Assessment**: Request from local council.
3. **National Insurance Credits**: Automatic with Carer's Allowance.
4. **Council Tax Discount**: Carers may qualify for exemption.
5. **Attendance Allowance**: Help person you care for claim (£68-£102/week).
6. **Direct Payments**: Request from council for flexible care arrangements.
7. **Respite Care**: Arrange breaks through local authority.
8. **Power of Attorney**: Set up LPA if person lacks capacity.

# RULES FOR "IMMIGRATING TO UK" (UK)
1. **BRP Collection**: Collect Biometric Residence Permit within 10 days.
2. **National Insurance Number**: Apply via GOV.UK (mandatory for work).
3. **NHS Registration**: Register with local GP surgery.
4. **Bank Account**: Open UK bank account (some accept BRP as ID).
5. **Council Tax**: Register at your address.
6. **Electoral Registration**: Register if eligible (Commonwealth/EU citizens).
7. **HMRC**: Register for self-assessment if self-employed.
8. **Driving Licence**: Exchange or apply for UK licence within 12 months.

# RULES FOR "BUYING PROPERTY" (UK)
1. **Solicitor/Conveyancer**: Instruct conveyancer, provide ID and funds proof.
2. **Mortgage Application**: Apply formally, provide payslips/accounts/bank statements.
3. **Survey**: Commission homebuyer report or full structural survey.
4. **Searches**: Local authority, environmental, drainage, chancel repair.
5. **Exchange Contracts**: Pay 10% deposit, set completion date.
6. **Buildings Insurance**: Required from exchange date.
7. **Stamp Duty**: Calculate SDLT (threshold £250k, FTB £425k).
8. **Land Registry**: Solicitor registers title after completion.

# RULES FOR "SELLING PROPERTY" (UK)
1. **EPC Certificate**: Legally required before marketing (£60-£120).
2. **Estate Agent**: Instruct agent or prepare for private sale.
3. **Solicitor**: Instruct for conveyancing, prepare title deeds.
4. **Capital Gains Tax**: Calculate if not primary residence (report within 60 days).
5. **Mortgage Redemption**: Request settlement figure from lender.
6. **Utility Final Readings**: Submit on completion day.

# RULES FOR "RENTING PROPERTY" (UK)
1. **Tenancy Agreement**: Review AST terms carefully.
2. **Deposit Protection**: Ensure deposit in TDS/DPS/MyDeposits scheme.
3. **Right to Rent Check**: Landlord must verify immigration status.
4. **Gas Safety Certificate**: Request annual CP12 from landlord.
5. **Contents Insurance**: Tenants need own contents cover.
6. **Council Tax**: Register at new address.

# RULES FOR "HOME RENOVATION" (UK)
1. **Planning Permission**: Check if needed via local planning portal.
2. **Building Regulations**: Required for structural, electrical, plumbing work.
3. **Party Wall Act**: Serve notice to neighbours if applicable.
4. **Listed Building Consent**: Required for Grade I/II listed properties.
5. **Building Control Sign-off**: Get completion certificate.
6. **Insurance**: Notify insurer of major works.
7. **VAT**: Some renovations qualify for 5% reduced rate.

# RULES FOR "DIVORCE" (UK)
1. **Petition**: File online at gov.uk (£593 court fee).
2. **Financial Order**: Apply for consent order to divide assets.
3. **Pension Sharing**: Get CETV and pension sharing order.
4. **Property**: Agree on family home (sell, transfer, or Mesher order).
5. **Child Arrangements**: Agree or apply for Child Arrangements Order.
6. **Will Update**: Existing wills may be partially revoked.
7. **Name Change**: Update passport, driving licence, bank accounts.
8. **Benefits**: Reassess tax credits, Universal Credit as single person.

# RULES FOR "DEATH IN FAMILY" (UK)
1. **Register Death**: Within 5 days at local register office.
2. **Tell Us Once**: GOV.UK service notifies multiple departments.
3. **Probate**: Apply for Grant of Probate if executor.
4. **Funeral**: Arrange and claim Funeral Expenses Payment if eligible.
5. **Bereavement Support Payment**: £3,500 lump sum + monthly payments.
6. **Pension**: Notify workplace and state pension.
7. **Banks**: Notify with death certificate, freeze accounts.
8. **Utilities**: Transfer or cancel accounts.

# RULES FOR "ADOPTION" (UK)
1. **Adoption Leave**: Up to 52 weeks from placement.
2. **Statutory Adoption Pay**: 90% salary for 6 weeks, then £172.48/week.
3. **Child Benefit**: Claim from placement date.
4. **Adoption Order**: Apply to court to become legal parent.
5. **Will Update**: Include adopted child.
6. **GP Registration**: Register child with your GP.
7. **School Place**: Apply through local authority.

# RULES FOR "CHILD STARTING SCHOOL" (UK)
1. **School Application**: Apply by January deadline for September entry.
2. **Uniform**: Budget £100-£300 for school uniform and PE kit.
3. **Free School Meals**: Apply if eligible (Universal Credit < £7,400).
4. **Childcare**: Arrange before/after school clubs or childminder.
5. **School Run**: Plan transport, walking bus, or cycle route.
6. **Medical Forms**: Complete school medical and allergy forms.

# RULES FOR "CHILDCARE ARRANGEMENTS" (UK)
1. **Tax-Free Childcare**: Government tops up £2 for every £8 (max £2000/yr).
2. **30 Hours Free**: 3-4 year olds eligible for 30 free hours/week.
3. **Childcare Vouchers**: Check if employer scheme still active.
4. **Ofsted Check**: Verify childminder/nursery registration.
5. **Universal Credit Childcare**: Claim up to 85% of costs.
6. **Employer Enhanced**: Check workplace nursery or childcare benefits.

# RULES FOR "STARTING BUSINESS" (UK)
1. **HMRC Registration**: Register as self-employed within 3 months.
2. **Business Bank Account**: Open separate business account.
3. **VAT Registration**: Mandatory if turnover exceeds £85,000.
4. **Companies House**: If forming limited company (£12 online).
5. **Business Insurance**: Public liability, professional indemnity.
6. **GDPR**: Register with ICO if processing personal data (£40/yr).
7. **Business Rates**: Register for business premises.
8. **Bookkeeping**: Set up accounting system for MTD compliance.

# RULES FOR "SELF EMPLOYED REGISTRATION" (UK)
1. **HMRC CWF1**: Register via GOV.UK for Self Assessment.
2. **UTR Number**: Arrives within 10 days of registration.
3. **National Insurance**: Class 2 (£3.45/week) and Class 4.
4. **Tax Return Deadline**: 31 January for online filing.
5. **Payment on Account**: Two payments (31 Jan + 31 Jul).
6. **Record Keeping**: Keep records for 5 years minimum.
7. **Allowable Expenses**: Understand what you can claim.

# RULES FOR "RETIRING" (UK)
1. **State Pension**: Check forecast at gov.uk (need 35 qualifying years).
2. **Private Pension**: Take 25% tax-free lump sum option.
3. **Annuity vs Drawdown**: Compare pension income options.
4. **Tax Code**: Inform HMRC of new income sources.
5. **NHS Prescription Exemption**: Free prescriptions at 60.
6. **Bus Pass**: Free at state pension age.
7. **Council Tax Discount**: Single person 25% discount if applicable.
8. **Will Update**: Review and update estate plans.

# RULES FOR "STARTING NEW JOB" (UK)
1. **Starter Checklist**: Complete for new employer (replaced P46).
2. **P45**: Give to new employer from previous job.
3. **Pension Auto-Enrolment**: Automatically enrolled after 3 months.
4. **Tax Code**: Verify correct code on first payslip.
5. **Emergency Contact**: Update HR records.
6. **Benefits**: Enrol in health, dental, life insurance schemes.
7. **Student Loan**: Confirm repayment plan with new employer.

# RULES FOR "WORKPLACE PENSION" (UK)
1. **Auto-Enrolment**: Minimum 5% employee + 3% employer.
2. **Salary Sacrifice**: Check if available for NI savings.
3. **Pension Provider**: Review fund choices and charges.
4. **Beneficiary Nomination**: Update death benefit nominations.
5. **Pension Consolidation**: Transfer old pots via Pension Tracing Service.
6. **Annual Allowance**: £60,000/year (or £10,000 if money purchase triggered).

# RULES FOR "REGISTERING WITH GP" (UK)
1. **Find GP**: Use NHS.uk to find accepting practices.
2. **GMS1 Form**: Complete registration form at surgery.
3. **Medical Records**: Transfer automatically from previous GP.
4. **Prescriptions**: Set up repeat prescriptions if needed.
5. **NHS App**: Download and link to new GP.

# RULES FOR "REGISTERING WITH DENTIST" (UK)
1. **Find NHS Dentist**: Use NHS.uk (many have long waiting lists).
2. **Band Charges**: Band 1 £25.80, Band 2 £70.70, Band 3 £306.80.
3. **HC2 Certificate**: Apply for help with costs if low income.
4. **Private Option**: Consider Denplan or private if no NHS places.

# RULES FOR "MATERNITY PATERNITY" (UK)
1. **Maternity Leave**: 52 weeks (39 weeks paid).
2. **SMP**: 90% salary for 6 weeks, then £172.48/week for 33 weeks.
3. **Paternity Leave**: 2 weeks at £172.48/week.
4. **Shared Parental Leave**: Share remaining leave between parents.
5. **MATB1 Form**: Get from midwife at 20 weeks.
6. **Employer Notice**: Notify by 15th week before due date.
7. **Sure Start Maternity Grant**: £500 for first child if on benefits.

# RULES FOR "LONG TERM ILLNESS" (UK)
1. **Fit Note**: Get from GP after 7 days sick.
2. **SSP**: £109.40/week for up to 28 weeks.
3. **ESA**: Apply if SSP runs out.
4. **PIP**: Apply for Personal Independence Payment.
5. **Blue Badge**: Apply if mobility difficulties.
6. **Prescription Prepayment**: £30.25/3 months or £108.10/year.
7. **Council Tax Reduction**: May qualify for disability reduction.

# RULES FOR "DISABILITY CLAIM" (UK)
1. **PIP Application**: Complete PIP2 "How your disability affects you".
2. **Assessment**: Attend or request home/paper assessment.
3. **Mandatory Reconsideration**: Challenge within 1 month if declined.
4. **Tribunal**: Appeal to First-tier Tribunal if MR unsuccessful.
5. **Disability Premium**: Extra Universal Credit element.
6. **Motability**: Use PIP enhanced mobility for car lease.
7. **Access to Work**: Claim for workplace adjustments.

# RULES FOR "GETTING DRIVING LICENCE" (UK)
1. **Provisional Licence**: Apply online £34, by post £43.
2. **Theory Test**: Book at gov.uk (£23).
3. **Practical Test**: Book at gov.uk (£62 weekday, £75 weekend).
4. **Insurance**: Learner insurance or named driver on policy.
5. **PASS Plus**: Optional course for insurance discount.

# RULES FOR "BUYING CAR" (UK)
1. **V5C Check**: Verify logbook matches seller.
2. **HPI Check**: £10-20 to check finance, theft, write-off.
3. **MOT History**: Free check at gov.uk.
4. **Insurance**: Get quotes before purchase (compare market).
5. **Road Tax**: Tax online at gov.uk immediately.
6. **V5C Transfer**: Notify DVLA of new keeper.

# RULES FOR "SELLING CAR" (UK)
1. **V5C**: Complete Section 6 and send to DVLA.
2. **Road Tax**: Refund remaining months.
3. **Insurance**: Cancel or transfer policy.
4. **MOT Certificate**: Provide to buyer.
5. **Service History**: Hand over with vehicle.

# RULES FOR "MOT TAX INSURANCE" (UK)
1. **MOT Due**: Check at gov.uk, book before expiry.
2. **Road Tax**: Must be taxed to drive on public roads.
3. **SORN**: Declare if keeping off-road untaxed.
4. **Insurance**: Minimum third-party required by law.
5. **Penalty**: £1000 fine for no tax, 6 points for no insurance.

# RULES FOR "COUNCIL TAX REGISTRATION" (UK)
1. **Register**: Contact local council within days of moving.
2. **Band Check**: Verify correct council tax band.
3. **Single Person Discount**: 25% off if living alone.
4. **Student Exemption**: Full exemption if all residents students.
5. **Council Tax Reduction**: Apply if on low income.
6. **Direct Debit**: Set up 10 or 12 monthly payments.

# RULES FOR "ELECTORAL REGISTER" (UK)
1. **Register**: Online at gov.uk/register-to-vote.
2. **Eligibility**: British, Irish, Commonwealth, or EU citizens.
3. **Annual Canvass**: Respond to annual registration letter.
4. **Credit Score**: Being on electoral roll helps credit rating.
5. **Postal Vote**: Apply if unable to vote in person.

# RULES FOR "APPLYING FOR BENEFITS" (UK)
1. **Benefits Calculator**: Use gov.uk calculator first.
2. **Universal Credit**: Apply online, attend initial interview.
3. **Housing Benefit**: Via local council if not on UC.
4. **Council Tax Reduction**: Separate application to council.
5. **PIP**: Separate application for disability.
6. **Carer's Allowance**: If caring 35+ hours/week.

# RULES FOR "UNIVERSAL CREDIT" (UK)
1. **Apply Online**: Set up UC account on gov.uk.
2. **ID Verification**: Verify identity online or at Jobcentre.
3. **Commitment Meeting**: Attend within days of claim.
4. **5-Week Wait**: First payment after 5 weeks (advance available).
5. **Journal**: Use online journal to report changes.
6. **Work Search**: Meet claimant commitment requirements.

# RULES FOR "PASSPORT" (UK - applying or renewing)
1. **Online Application**: £82.50 adult, £53.50 child.
2. **Photos**: Digital photo or booth photo meeting requirements.
3. **Countersignatory**: If first passport or changed appearance.
4. **Processing Time**: Allow 10 weeks standard.
5. **Fast Track**: £142 for 1-week service.

# RULES FOR "NAME CHANGE DEED POLL" (UK)
1. **Deed Poll**: Make enrolled (£42.44) or unenrolled (free).
2. **Passport**: Apply for new passport with deed poll.
3. **Driving Licence**: Update free of charge.
4. **Bank Accounts**: Update all banks with deed poll.
5. **HMRC**: Update via personal tax account.
6. **Electoral Roll**: Update registration.
7. **NHS**: Update via GP surgery.

# RULES FOR "VISA RENEWAL" (UK)
1. **Apply Before Expiry**: Apply before current visa expires.
2. **Section 3C Leave**: Automatically extends if applied in time.
3. **BRP**: New BRP issued with new visa.
4. **Employer**: Notify employer of visa renewal.
5. **Bank**: Update bank with new BRP/visa details.

# RULES FOR "SETTLED STATUS" (UK)
1. **EU Settlement Scheme**: Apply via app with valid ID.
2. **5 Years Continuous Residence**: Required for settled status.
3. **Pre-Settled**: 5 years to convert to settled.
4. **NHS**: Continue using NHS services.
5. **Benefits**: Full access with settled status.

# RULES FOR "CITIZENSHIP APPLICATION" (UK)
1. **Life in the UK Test**: Pass before applying (£50).
2. **English Language**: B1 level certificate required.
3. **Application Fee**: £1,330 (non-refundable).
4. **Ceremony**: Attend citizenship ceremony within 3 months.
5. **British Passport**: Apply after receiving certificate.

# RULES FOR "OPENING BANK ACCOUNT" (UK)
1. **ID Required**: Passport/driving licence + proof of address.
2. **Basic Account**: Available to everyone regardless of credit.
3. **Compare**: Current account switching service (CASS).
4. **Overdraft**: Understand fees before agreeing.
5. **Direct Debits**: Set up essential payments.

# RULES FOR "APPLYING FOR MORTGAGE" (UK)
1. **Agreement in Principle**: Get AIP before house hunting.
2. **Deposit**: Typically 5-20% of property value.
3. **Affordability**: 4-4.5x income multiplier typical.
4. **Documents**: 3 months payslips, 3 months bank statements, ID.
5. **Mortgage Broker**: Consider for best rates.
6. **Help to Buy ISA/LISA**: Use government bonus if eligible.

# RULES FOR "REMORTGAGING" (UK)
1. **Compare Rates**: Check 3-6 months before deal ends.
2. **ERC**: Check early repayment charges on current deal.
3. **Valuation**: Lender may require new valuation.
4. **Conveyancer**: May need solicitor for remortgage.
5. **Product Transfer**: Same lender switch often simpler.

# RULES FOR "DEALING WITH DEBT" (UK)
1. **StepChange**: Free debt advice charity.
2. **Priority Debts**: Mortgage, council tax, utilities first.
3. **DMP**: Debt Management Plan for unsecured debts.
4. **Breathing Space**: 60-day legal protection from creditors.
5. **IVA**: Individual Voluntary Arrangement option.
6. **DRO**: Debt Relief Order if debts under £30,000.

# RULES FOR "BANKRUPTCY IVA" (UK)
1. **Adjudicator Application**: Apply online (£680 fee).
2. **Official Receiver**: Manages your case for 12 months.
3. **Assets**: May lose property, vehicle above £2,000.
4. **Credit File**: Stays for 6 years.
5. **Bank Account**: Open basic account (some banks refuse).
6. **Employer**: May affect certain professions.

# RULES FOR "MAKING A WILL" (UK)
1. **Solicitor**: Professional will costs £150-£300.
2. **Witnesses**: Two independent witnesses required.
3. **Executor**: Appoint trusted person or solicitor.
4. **Intestacy Rules**: Without will, assets distributed by law.
5. **IHT Planning**: Consider nil-rate band and residence nil-rate.
6. **Review**: Update after marriage, divorce, children, property.

# RULES FOR "POWER OF ATTORNEY" (UK)
1. **LPA Types**: Property & Financial Affairs, Health & Welfare.
2. **Registration**: Register with OPC (£82 per LPA).
3. **Certificate Provider**: Independent person must certify.
4. **Attorney**: Choose trusted person(s).
5. **Mental Capacity**: Must have capacity when making LPA.

# RULES FOR "PROBATE" (UK)
1. **Apply**: Online at gov.uk (£273 if estate > £5,000).
2. **IHT Forms**: Submit IHT205 or IHT400.
3. **Executor Duties**: Collect assets, pay debts, distribute estate.
4. **Time Limit**: Beneficiaries can claim within 12 years.
5. **Deed of Variation**: Can redirect inheritance within 2 years.

# RULES FOR "STUDENT FINANCE" (UK)
1. **Apply Early**: Apply by May for September start.
2. **Tuition Loan**: Up to £9,250/year.
3. **Maintenance Loan**: Based on household income.
4. **Repayment**: Plan 2 threshold £27,295 (9% above).
5. **Bursaries**: Check university-specific financial support.

# RULES FOR "PROFESSIONAL QUALIFICATION" (UK)
1. **CPD Requirements**: Check professional body requirements.
2. **Study Leave**: Check employer study leave policy.
3. **Tax Relief**: Claim for professional subscriptions via P87.
4. **Exam Fees**: Some employers reimburse.

# RULES FOR "SWITCHING ENERGY PROVIDER" (UK)
1. **Compare**: Use Ofgem-accredited comparison sites.
2. **Cooling-Off**: 14-day cooling-off period.
3. **Smart Meter**: Request if not already installed.
4. **Fixed vs Variable**: Understand tariff differences.
5. **Warm Home Discount**: £150 if eligible (pension credit).

# RULES FOR "BROADBAND SETUP" (UK)
1. **Compare**: Check availability at address.
2. **Contract Length**: 12, 18, or 24 month contracts typical.
3. **Speed**: Check actual vs advertised speeds.
4. **Installation**: May need engineer visit.
5. **Cooling-Off**: 14-day cooling-off for new contracts.

For ALL event types not listed above, use your expertise as a UK-based advisor to generate comprehensive, accurate tasks with real UK-specific information, costs, deadlines, and GOV.UK references.

Return ONLY valid JSON, no markdown. Generate 15-30 comprehensive tasks appropriate for the event type.`;

// GET: List all life events
export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const events = await prisma.lifeEvent.findMany({
      where: { userId: { in: userIds } },
      orderBy: { eventDate: 'desc' },
      include: {
        tasks: {
          orderBy: [
            { priority: 'asc' },
            { dueDate: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching life events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch life events' },
      { status: 500 }
    );
  }
}

// Helper to lookup postcode information
async function lookupPostcodeInfo(postcode: string): Promise<{
  council: string;
  region: string;
  ward: string;
  parish: string;
} | null> {
  try {
    const cleanPostcode = postcode.replace(/\s/g, '');
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
    const data = await response.json();
    
    if (data.status === 200 && data.result) {
      return {
        council: data.result.admin_district || data.result.admin_county || 'Unknown Council',
        region: data.result.region || 'Unknown Region',
        ward: data.result.admin_ward || '',
        parish: data.result.parish || ''
      };
    }
    return null;
  } catch {
    return null;
  }
}

// POST: Create a new life event and generate tasks with AI
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { eventType, title, description, eventDate, details } = body;

    if (!eventType || !title || !eventDate) {
      return NextResponse.json(
        { error: 'eventType, title, and eventDate are required' },
        { status: 400 }
      );
    }

    // Fetch user's providers for context
    const userIds = await getAccessibleUserIds(userId);
    const providers = await prisma.provider.findMany({
      where: { userId: { in: userIds } },
      include: { accounts: true }
    });

    const providerList = providers.map(p => ({
      name: p.name,
      type: p.type,
      accounts: p.accounts.map(a => a.accountName)
    }));

    // Enrich with postcode data for moving house
    let enrichedDetails = { ...details };
    if (eventType === 'moving_house') {
      if (details?.fromPostcode) {
        const fromInfo = await lookupPostcodeInfo(details.fromPostcode);
        if (fromInfo) {
          enrichedDetails.fromCouncil = fromInfo.council;
          enrichedDetails.fromRegion = fromInfo.region;
          enrichedDetails.fromWard = fromInfo.ward;
        }
      }
      if (details?.toPostcode) {
        const toInfo = await lookupPostcodeInfo(details.toPostcode);
        if (toInfo) {
          enrichedDetails.toCouncil = toInfo.council;
          enrichedDetails.toRegion = toInfo.region;
          enrichedDetails.toWard = toInfo.ward;
        }
      }
    }

    // Call LLM to generate tasks
    const eventInput = {
      event_type: eventType,
      event_details: {
        title,
        description,
        date: eventDate,
        ...enrichedDetails
      },
      current_providers: providerList
    };

    console.log('[LifeEvent] Calling LLM with input:', JSON.stringify(eventInput, null, 2));

    const result = await callAI(
      [
        { role: 'system', content: LIFE_EVENT_ORCHESTRATOR_PROMPT },
        { role: 'user', content: JSON.stringify(eventInput) }
      ],
      { maxTokens: 8000, temperature: 0.3 }
    );

    const aiResponse = result.content || '';
    console.log('[LifeEvent] AI Response:', aiResponse);

    // Parse the AI response
    let generatedTasks: Array<{
      title: string;
      description: string;
      provider_category: string;
      priority: string;
      due_offset_days: number;
      reference_url?: string;
    }> = [];

    try {
      // Clean up response (remove markdown code blocks if present)
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(cleanResponse);
      generatedTasks = parsed.tasks || [];
    } catch (parseError) {
      console.error('[LifeEvent] Failed to parse AI response:', parseError);
      // Continue with empty tasks if parsing fails
    }

    // Create the life event
    const lifeEvent = await prisma.lifeEvent.create({
      data: {
        eventType: eventType as any,
        title,
        description,
        eventDate: new Date(eventDate),
        details: details || {},
        status: 'active',
        userId,
      }
    });

    // Create tasks from AI response
    const eventDateObj = new Date(eventDate);
    const createdTasks = await Promise.all(
      generatedTasks.map(async (task) => {
        // Calculate due date based on offset
        const dueDate = new Date(eventDateObj);
        dueDate.setDate(dueDate.getDate() + (task.due_offset_days || 0));

        // Map priority string to enum
        let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
        if (task.priority === 'critical') priority = 'critical';
        else if (task.priority === 'high') priority = 'high';
        else if (task.priority === 'low') priority = 'low';

        return prisma.lifeEventTask.create({
          data: {
            lifeEventId: lifeEvent.id,
            title: task.title,
            description: task.description,
            providerCategory: task.provider_category || 'other',
            priority,
            dueOffsetDays: task.due_offset_days || 0,
            dueDate,
            referenceUrl: task.reference_url || null,
            status: 'pending'
          }
        });
      })
    );

    // Fetch the complete event with tasks
    const completeEvent = await prisma.lifeEvent.findUnique({
      where: { id: lifeEvent.id },
      include: {
        tasks: {
          orderBy: [
            { priority: 'asc' },
            { dueDate: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({
      success: true,
      event: completeEvent,
      tasksGenerated: createdTasks.length
    });
  } catch (error) {
    console.error('Error creating life event:', error);
    return NextResponse.json(
      { error: 'Failed to create life event' },
      { status: 500 }
    );
  }
}
