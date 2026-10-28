/**
 * widgets/chatbot.js : "Land Assistant" chat widget (lazy-loaded on first click of the chat button)
 * A rule-based assistant: normalises the question (Bangla / Banglish / English), scores it against the knowledge
 * base KB by keywords (+ fuzzy match for Latin words), and also converts land units typed in a sentence.
 * Chat history is kept in sessionStorage; the panel can be minimised, cleared or closed.
 */
(function(){
var NO='8801745473151',BD='০১২৩৪৫৬৭৮৯';
/** WhatsApp link with a prefilled message. */
function wa(m){return'https://wa.me/'+NO+'?text='+encodeURIComponent(m)}
/** Western digits to Bengali digits. */
function bn(s){return String(s).replace(/\d/g,function(d){return BD[d]})}
/** Bengali digits to Western digits. */
function en(s){return String(s).replace(/[০-৯]/g,function(c){return BD.indexOf(c)})}
/** Normalise text for matching. */
function norm(t){return en(String(t)).normalize('NFC').toLowerCase().replace(/[\u200c\u200d]/g,'').replace(/[^\u0980-\u09ff a-z0-9]/g,' ').replace(/\s+/g,' ').trim()}
/** Edit distance (typo tolerance for Latin words). */
function lev(a,b){var m=a.length,n=b.length,d=[],i,j;for(i=0;i<=m;i++)d[i]=[i];for(j=1;j<=n;j++)d[0][j]=j;
 for(i=1;i<=m;i++)for(j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}

/* ---------- knowledge base (taken from the site's pages) ---------- */
var B={
 wa:{t:'WhatsApp-এ জানান',wa:'আসসালামু আলাইকুম, আমি আপনাদের সেবা সম্পর্কে জানতে চাই।',c:'w'},
 porcha:{t:'পর্চা পাতা',h:'/services/porcha/'},khajna:{t:'খাজনা পাতা',h:'/services/khajna/'},namjari:{t:'নামজারি পাতা',h:'/services/namjari/'},
 dolil:{t:'দলিল পাতা',h:'/deeds/'},jorip:{t:'জরিপ পাতা',h:'/learn/land-survey/'},itihas:{t:'ইতিহাস পাতা',h:'/learn/land-history/'},
 hisab:{t:'জমির হিসাব',h:'/calculators/land-area/'},hissa:{t:'আনা-গণ্ডা ও হিস্যা',h:'/calculators/ana-gonda-hissa/'},dolilfee:{t:'দলিল ফি ক্যালকুলেটর',h:'/calculators/deed-fee/'},nokolfee:{t:'নকল তল্লাশ ফি',h:'/calculators/copy-fee/'},dcr:{t:'ডিসিআর পাতা',h:'/services/dcr/'},mouza:{t:'মৌজা ম্যাপ পাতা',h:'/services/mouza-map/'},dmap:{t:'ডিজিটাল ম্যাপ পাতা',h:'/services/digital-map/'},jano:{t:'জমি সম্পর্কে জানুন',h:'/learn/'},faq:{t:'প্রশ্নোত্তর',h:'/faq/'},svc:{t:'সব সেবা',h:'/services/'},faraiz:{t:'ফারায়েজ ক্যালকুলেটর',h:'/calculators/faraiz/'},contact:{t:'যোগাযোগের ফরম',h:'/contact/'},
 call:{t:'কল করুন',h:'tel:+8801745473151'}};
/** Button definition that opens WhatsApp with a message. */
function W(t,m){return{t:t,wa:m,c:'w'}}

var KB=[
{id:'hello',short:1,k:['হ্যালো','হাই','আসসালামু','সালাম','নমস্কার','হ্যাঁ','hello','hi','hey','salam','assalamu','assalamualaikum'],
 a:'আসসালামু আলাইকুম! জমির কাগজ, সেবা, খরচ বা ক্যালকুলেটর নিয়ে যা জানতে চান লিখুন।',n:['সেবা সমূহ','পর্চা কী','নামজারির খরচ']},
{id:'thanks',short:1,k:['ধন্যবাদ','শুকরিয়া','থ্যাংকস','thanks','thank','thx','dhonnobad','ঠিক আছে','ok','okay'],
 a:'আপনাকেও ধন্যবাদ। আর কিছু জানার থাকলে লিখুন।',n:['সেবা সমূহ']},
{id:'bot',k:['তুমি কি রোবট','রোবট','এআই','মানুষ নাকি','তুমি কে','আপনি কে','who are you','are you ai','are you bot','tumi ke','apni ke','robot'],
 a:'আমি আল-আমিন ডিজিটাল ল্যান্ড সার্ভে সাইটের স্বয়ংক্রিয় সহায়ক, মানুষ নই। সাইটের তথ্য থেকে উত্তর দিই। উত্তর না পেলে বা সরাসরি কথা বলতে চাইলে WhatsApp-এ জানান।',b:[B.wa]},
{id:'about',k:['আল আমিন','আল-আমিন','কারা আপনারা','পরিচয়','আপনাদের সম্পর্কে','al amin','alamin','about','apnara kara','porichoy','কে চালান','মালিক কে'],
 a:'আল-আমিন ডিজিটাল ল্যান্ড সার্ভে চালান মো. আল-আমিন (B.Sc in CSE, আমিনশিপ প্রশিক্ষণ, BTEB, Reg. No. 3025227431)। এলাকা ঘাটাইল, টাঙ্গাইল ও আশপাশ। সার্ভেয়ার, আইটি ও আইনজীবী টিম একসাথে কাজ করে।',b:[B.contact,B.wa]},
{id:'contact',k:['মোবাইল নম্বর','ফোন নম্বর','নাম্বার দিন','আপনার নম্বর','যোগাযোগ','কল করব','ফেসবুক','হোয়াটসঅ্যাপ','whatsapp','contact','phone','mobile number','number','facebook','jogajog','nombor','number den','কথা বলতে চাই'],
 a:'ফোন ও WhatsApp: +880 1745-473151\nFacebook: convincing.alamin11\nযোগাযোগের ফরমে জমির তথ্য লিখলে সাজানো বার্তা WhatsApp-এ চলে যাবে।',b:[B.wa,B.call,B.contact]},
{id:'where',k:['ঠিকানা','কোথায় বসেন','কোন এলাকা','কোন এলাকায়','অফিস কোথায়','ঘাটাইল','টাঙ্গাইল','address','location','office kothay','ghatail','tangail','kothay','কোথায়'],
 a:'আমরা সারা বাংলাদেশে সেবা দিই। অনলাইন কাজ (পর্চা, খাজনা, নামজারি, PDF, মৌজা ম্যাপ) সরাসরি হয়, আর দেশের বাইরে থেকেও কাগজ WhatsApp-এ পাঠিয়ে কাজ করানো যায়। সরেজমিন মাপের কাজ হবে কি না, আপনার এলাকা জানালে বলে দেব।',b:[W('আমার এলাকা জানাই','আমার এলাকার জমির কাজ করা যাবে কি না জানতে চাই। এলাকা: ')]},
{id:'hours',k:['অফিস টাইম','খোলা থাকে','কখন খোলা','কখন কল','কখন পাওয়া','office time','opening hours','kokhon'],
 a:'সাইটে নির্দিষ্ট সময়সূচি দেওয়া নেই। যোগাযোগের ফরমে "কখন কল করলে সুবিধা" বেছে নিতে পারেন, বা WhatsApp-এ বার্তা রেখে দিন।',b:[B.contact,B.wa]},
{id:'services',k:['কী কী সেবা','কি কি সেবা','সেবা সমূহ','সেবা','সার্ভিস','কী কাজ করেন','কি কাজ করেন','what services','services','service','ki ki seba','seba','kaj kori','কাজ করেন'],
 a:'আমাদের সেবা:\n• পর্চা/রেকর্ড/খতিয়ান (আংশিক খতিয়ানসহ)\n• নামজারি ও ডিসিআর\n• ভূমি উন্নয়ন কর (খাজনা), ভূমি পোর্টাল অ্যাকাউন্ট খোলা ও ভেরিফাই\n• মৌজা ম্যাপ, মৌজাভিত্তিক খতিয়ান বই (PDF)\n• ডিজিটাল ম্যাপ (AutoCAD, BD CAD), পেন্টাগ্রাফ, সীমানা নির্ধারণ\n• সব ধরনের দলিল লেখা ও পুরোনো দলিলের নকল তোলা\n• ওয়ারিশ ও ভাগ-বণ্টন, মালিকানা যাচাই, আইনজীবীর পরামর্শ\n• ক্যালকুলেটর: জমির হিসাব, ফারায়েজ, আনা-গণ্ডা, দলিল ফি, নকল ফি',n:['খরচ কত','খতিয়ান বই PDF','পোর্টাল অ্যাকাউন্ট'],b:[B.svc,B.wa]},
{id:'porcha',k:['পর্চা','পরচা','খতিয়ান','খতিয়ান কী','porcha','porchha','khatian','khotiyan','khotian','khatiyan','eporcha','ই পর্চা','অনলাইন পর্চা'],
 a:'খতিয়ান বা পর্চা হলো জমির সরকারি রেকর্ডের পাতা: কার জমি, কোন মৌজার কোন দাগে, কত পরিমাণ, কী শ্রেণি।\nঅনলাইনে পেতে: eporcha.gov.bd-এ গিয়ে বিভাগ-জেলা-উপজেলা-মৌজা বাছুন, খতিয়ানের ধরন ও নম্বর (বা দাগ নম্বর/মালিকের নাম) দিন, সরকারি ফি অনলাইনে দিয়ে কপি নামান। হেল্পলাইন ১৬১২২।\nআমরা বের করে দিতেও পারি।',b:[B.porcha,W('পর্চা বের করে দিন','পর্চা / খতিয়ান বের করার সেবা সম্পর্কে জানতে চাই।')],n:['সিএস এসএ আরএস কী','খতিয়ানে ভুল','খতিয়ান বই PDF']},
{id:'mouzabook',k:['খতিয়ান বই','মৌজাভিত্তিক','মৌজা ভিত্তিক','বই পিডিএফ','খতিয়ানের বই','khatian boi','khotiyan boi','khotian boi','mouza vittik','mouja vittik','mouza wise','mouja wise','boi','pdf','পিডিএফ'],
 a:'মৌজাভিত্তিক খতিয়ান বই (PDF): আপনার মৌজার সিএস, এসএ, আরএস ও বিআরএস খতিয়ান একসাথে বই আকারে সাজানো PDF, মোবাইলে পড়া ও প্রিন্ট দুটোর উপযোগী।\nমৌজার নাম ও কোন জরিপের খতিয়ান লাগবে জানান। সংগ্রহে আছে কি না ও খরচ আমরা জানিয়ে দেব।',b:[W('খতিয়ান বই চাই','মৌজাভিত্তিক খতিয়ান বই (PDF) সেবা সম্পর্কে জানতে চাই। মৌজার নাম: '),B.porcha]},
{id:'portal',k:['অ্যাকাউন্ট','একাউন্ট','অ্যাকাউন্ট','ভেরিফাই','পোর্টাল','ভূমি পোর্টাল','ভূমি সেবা','লিংক','ওয়েবসাইট','account','accound','verify','portal','vumi','bhumi','bhumi portal','vumi portal','link','website','land.gov.bd','ldtax','nid দিয়ে','রেজিস্ট্রেশন করব','নিবন্ধন'],
 a:'ভূমি পোর্টালে অ্যাকাউন্ট খোলা ও ভেরিফাই আমরা করে দিই: জাতীয় পরিচয়পত্র, জন্মতারিখ ও মোবাইল নম্বরে নিবন্ধন, ওটিপি যাচাই, খতিয়ান যুক্ত করা ও অনুমোদনের ধাপে সাহায্য।\nপোর্টালগুলো: পর্চা eporcha.gov.bd, খাজনা ldtax.gov.bd (বা land.gov.bd), নামজারি mutation.land.gov.bd। হেল্পলাইন ১৬১২২।',b:[W('অ্যাকাউন্ট খুলতে চাই','ভূমি পোর্টালে অ্যাকাউন্ট খুলে ভেরিফাই করাতে চাই।'),B.khajna],n:['খাজনা কীভাবে দেব']},
{id:'jorip',k:['সিএস','এসএ','আরএস','বিআরএস','জরিপ','জরীপ','সার্ভে কী','cs khatian','sa khatian','rs khatian','brs','jorip','jorib','survey','cs','রি সার্ভে'],
 a:'চার জরিপ:\n• সিএস (ব্রিটিশ আমল, আনুমানিক ১৮৮৮–১৯৪০): জমির আদি মালিক ও স্বত্বের মূল উৎস\n• এসএ (পাকিস্তান আমল, ১৯৫০-এর মাঝামাঝি থেকে): জমিদারি বিলোপের পর প্রজার নামে রেকর্ড\n• আরএস (১৯৬০-এর দশক থেকে ১৯৮০ পর্যন্ত, কোথাও আরও পরে): বহু এলাকায় সর্বশেষ জরিপ, নামজারির ভিত্তি\n• বিআরএস (১৯৯০-এর দশক থেকে): কম্পিউটারে ছাপা, হালনাগাদ রেকর্ড\nসময় জেলাভেদে আলাদা, তাই এলাকা ধরে মিলিয়ে নিন।',b:[B.jorip],n:['বিডিএস কী','জমির ইতিহাস']},
{id:'bds',k:['বিডিএস','ডিজিটাল জরিপ','ডিজিটাল সার্ভে','bds','digital survey','digital jorip','বাংলাদেশ ডিজিটাল সার্ভে'],
 a:'বিডিএস (বাংলাদেশ ডিজিটাল সার্ভে) হলো ড্রোন, জিএনএসএস ও আধুনিক যন্ত্রে করা পুরোপুরি ডিজিটাল জরিপ: দাগভিত্তিক ডিজিটাল মানচিত্র ও রেকর্ড, নামজারির ডিজিটাল ব্যবস্থার সাথে যুক্ত।\nপ্রথম পর্যায়ে চট্টগ্রাম, নারায়ণগঞ্জ, রাজশাহী সিটি, মানিকগঞ্জ পৌর এলাকা, ধামরাই ও কুষ্টিয়া সদরে কাজ হয়েছে। আপনার এলাকায় কবে, স্থানীয় ভূমি অফিসের নোটিশ দেখুন।\nপ্রস্তুতি: দলিল, বায়া দলিল, সব জরিপের খতিয়ান, নামজারি খতিয়ান ও ডিসিআর, সর্বশেষ দাখিলা, এনআইডি, ওয়ারিশান সনদ (দরকারে)। নোটিশের দিন জমিতে উপস্থিত থাকুন, আল ও সীমানা চিহ্ন ঠিক রাখুন।',b:[B.jorip,B.wa]},
{id:'khajna',k:['খাজনা','ভূমি উন্নয়ন কর','দাখিলা','দাখিল','মওকুফ','২৫ বিঘা','khajna','khazna','khajna','dakhila','dakhila','land tax','ভূমি কর','ভুমি কর','কর দিতে','tax'],
 a:'খাজনার সরকারি নাম ভূমি উন্নয়ন কর। প্রতি অর্থবছরের (জুলাই–জুন) কর দিলে রসিদ পান, তার নাম দাখিলা। দাখিলা লাগে নামজারি, জমি বিক্রি/রেজিস্ট্রি, ব্যাংক ঋণ ও দখলের প্রমাণে।\nঅনলাইনে: ldtax.gov.bd বা land.gov.bd-এ এনআইডি, জন্মতারিখ, মোবাইল দিয়ে নিবন্ধন (ওটিপি) → খতিয়ান যুক্ত (ইউনিয়ন ভূমি অফিস যাচাই করে) → কর দেখুন → বিকাশ/নগদ/রকেট/উপায়/কার্ডে পরিশোধ → দাখিলা নামান।\nকৃষিজমি পরিবারভিত্তিক ২৫ বিঘা পর্যন্ত হলে কর মওকুফের বিধান আছে। বকেয়া জমতে দেবেন না। নিয়ম বদলাতে পারে।',b:[B.khajna,W('খাজনায় সাহায্য চাই','ভূমি উন্নয়ন কর (খাজনা) পরিশোধে সহায়তা চাই।')]},
{id:'namjari',k:['নামজারি','নামজারী','মিউটেশন','নাম খারিজ','namjari','namzari','namjary','mutation','নামজারির খরচ','নামজারি ফি'],
 a:'নামজারি হলো সরকারি খতিয়ানে মালিকের নাম বদলানোর প্রক্রিয়া। দলিল রেজিস্ট্রি হলেও খতিয়ানে নাম আপনা-আপনি বদলায় না। শেষে নিজের নামে নতুন খতিয়ান ও ডিসিআর পান।\nসরকারি ফি: আবেদন ৭০ টাকা (কোর্ট ফি ২০ + নোটিশ ফি ৫০), মঞ্জুর হলে ডিসিআর ফি ১,১০০ টাকা, মোট ১,১৭০ টাকা। নিষ্পত্তি সাধারণত ২৮ দিন। ফি ও সময় বদলাতে পারে।\nধাপ: mutation.land.gov.bd বা ডিজিটাল সেন্টারে আবেদন → ইউনিয়ন ভূমি অফিসের তদন্ত → এসি ল্যান্ডের শুনানি → মঞ্জুর হলে ডিসিআর ফি → খতিয়ান ও ডিসিআর নামানো।\nকাগজ — কিনে থাকলে: রেজিস্ট্রিকৃত দলিল, বায়া দলিল, বিক্রেতার খতিয়ান, হালনাগাদ দাখিলা, এনআইডি ও ছবি। উত্তরাধিকারে: ওয়ারিশান সনদ, মৃত্যু সনদ, ওয়ারিশদের পরিচয়পত্র বা জন্মনিবন্ধন, মৃত মালিকের খতিয়ান ও দাখিলা।',b:[B.namjari,W('নামজারির কাগজ গুছিয়ে দিন','নামজারির কাগজ গুছিয়ে নিতে সাহায্য চাই।')]},
{id:'dolil',k:['দলিল','রেজিস্ট্রি','রেজিস্ট্রেশন খরচ','dolil','dalil','registry'],
 a:'দলিল হলো জমি বিক্রি, দান, ভাগ বা বন্ধকের লিখিত চুক্তি। বিক্রয়, দান ও বিনিময়ের দলিল সাব-রেজিস্ট্রি অফিসে রেজিস্ট্রি করা আইনত বাধ্যতামূলক।\nধরন: সাফ কবলা (টাকায় বিক্রি), হেবা (দান), হেবা বিল এওয়াজ (বিনিময় নিয়ে দান), বণ্টননামা (শরিকদের ভাগ), বিনিময়, বন্ধক ও ইজারা, আম-মোক্তারনামা।\nরেজিস্ট্রির খরচে স্ট্যাম্প শুল্ক, রেজিস্ট্রেশন ফি, স্থানীয় সরকার কর, বিক্রেতার উৎসে কর ইত্যাদি থাকে। জমির মূল্য ও এলাকাভেদে মোট বদলায়।',b:[B.dolil,W('দলিল যাচাই করাতে চাই','দলিল ও খতিয়ান মিলিয়ে আইনি মতামত নিতে চাই।')],n:['কেনার আগে যাচাই']},
{id:'buycheck',k:['কেনার আগে','কেনার আগে যাচাই','জমি কিনব','জমি কিনতে','মালিকানা যাচাই','মালিকানা','jami kinbo','jami kenar age','kenar age','malikana','buy land','before buying','ownership'],
 a:'জমি কেনার আগে যাচাই করুন:\n• বিক্রেতার নামে বর্তমান খতিয়ান ও নামজারি আছে কি না\n• মূল দলিল ও বায়া দলিলের ধারা (আগের মালিকদের ক্রম)\n• হালনাগাদ খাজনার দাখিলা\n• সরেজমিনে দখল ও সীমানা, দরকারে মৌজা ম্যাপ ও পেন্টাগ্রাফ মিলিয়ে\n• জমি বন্ধক, মামলা বা অধিগ্রহণের আওতায় আছে কি না\n• উত্তরাধিকারসূত্রের জমি হলে সব ওয়ারিশের সম্মতি\nআমরা কাগজ মিলিয়ে দিই, আইনজীবী টিম মতামত দেয়।',b:[W('মালিকানা যাচাই','আমার জমির কাগজ মিলিয়ে মালিকানা যাচাই করাতে চাই।')]},
{id:'demarc',k:['ডিমার্কেশন','সীমানা','জমি মাপ','জমি মাপাতে','সীমানা বিরোধ','demarcation','simana','jami mapa','jomi mapte','land measure surveyor','সার্ভেয়ার ডাকতে'],
 a:'ডিমার্কেশন মানে জমির সীমানা মেপে চিহ্নিত করা, যাতে প্রতিবেশীর সাথে ঝামেলা না হয়। মৌজা, দাগ নম্বর ও আপনার কাগজ পাঠালে আমরা কাজের ধাপ ও খরচ জানাব। সরকারি কাজে সার্ভেয়ারের সরেজমিন মাপই গ্রহণযোগ্য।',b:[W('ডিমার্কেশন চাই','ডিমার্কেশন সেবা সম্পর্কে জানতে চাই।')]},
{id:'mouzamap',k:['পেন্টাগ্রাফ','মৌজা ম্যাপ','মৌজা নকশা','মৌজার ম্যাপ','জমির নকশা','pentagraph','pentagraf','mouza map','mouja map','nokshaa','noksha','নকশা'],
 a:'মৌজা ম্যাপ হলো গ্রামের নকশা, যেখানে আপনার জমির দাগ নম্বর ও অবস্থান থাকে। পেন্টাগ্রাফ হলো সেই দাগ অনুযায়ী প্লটের আকার ধরে করা নকশা। দুটোই আমরা করে দিই।',b:[W('মৌজা ম্যাপ ও পেন্টাগ্রাফ','মৌজা ম্যাপ ও পেন্টাগ্রাফ সেবা সম্পর্কে জানতে চাই।')]},
{id:'cad',k:['অটোক্যাড','অটো ক্যাড','বিডি ক্যাড','ডিজিটাল নকশা','autocad','auto cad','bd cad','bdcad','cad','cad noksha'],
 a:'BD CAD ও AutoCAD নকশা: মৌজা ম্যাপ ও জমির মাপসহ পরিষ্কার ডিজিটাল নকশা, প্রিন্টের উপযোগী।',b:[W('নকশা চাই','BD CAD ও AutoCAD নকশা সেবা সম্পর্কে জানতে চাই।')]},
{id:'surveyor',k:['সার্ভেয়ার','টোটাল স্টেশন','ড্রোন','লেভেলিং','জিএনএসএস','surveyor','total station','drone','leveling','সেটআউট'],
 a:'সার্ভেয়ারের সাধারণ সেবা: সীমানা নির্ধারণ ও ডিমার্কেশন, মৌজা ম্যাপ থেকে পেন্টাগ্রাফ, ভাগ-বণ্টন ও প্লট ভাগের নকশা, টোটাল স্টেশন-জিএনএসএস-ড্রোন জরিপ, লেভেলিং, ভবন-রাস্তা-পুকুরের সেটআউট ও ক্ষেত্রফল হিসাব।',b:[B.wa]},
{id:'faraiz',k:['ওয়ারিশ','ওয়ারিশান','ভাগ বণ্টন','ভাগ-বণ্টন','উত্তরাধিকার','ফারায়েজ','ফরায়েজ','ফারায়েজ','কে কত পাবে','কত অংশ','স্ত্রী কত','মেয়ে কত','ছেলে কত','faraiz','faraij','farayej','waris','warish','ke koto pabe','inheritance','sompotti bhag','সম্পত্তি ভাগ','দায়ভাগা'],
 a:'মুসলিম (হানাফী) মূল অংশ:\n• স্বামী: সন্তান না থাকলে ১/২, থাকলে ১/৪\n• স্ত্রী (একাধিক হলে মিলে): সন্তান না থাকলে ১/৪, থাকলে ১/৮\n• মাতা: সন্তান বা দুই+ ভাই-বোন থাকলে ১/৬, নইলে ১/৩\n• পিতা: পুত্র থাকলে ১/৬, সন্তান না থাকলে অবশিষ্ট সব\n• কন্যা: একজন ১/২, দুই+ মিলে ২/৩; পুত্র থাকলে পুত্র পায় কন্যার দ্বিগুণ\nকে কত পাবেন, ওয়ারিশদের সংখ্যা দিয়ে ফারায়েজ ক্যালকুলেটরে হিসাব করুন (আউল-রদসহ)। হিন্দু দায়ভাগা সূত্রের সরল হিসাবও আছে। মৃত সন্তানের সন্তান (নাতি-নাতনি) ক্যালকুলেটরে যোগ করা যায়। জটিল বিরোধে আইনজীবীর পরামর্শ নিন।',b:[B.faraiz,W('ওয়ারিশ ও ভাগ-বণ্টন','ওয়ারিশ ও ভাগ-বণ্টন সেবা সম্পর্কে জানতে চাই।')]},
{id:'anakora',k:['আনা কড়া','আনা-কড়া','আনা গণ্ডা','কত আনা','ষোল আনা','১৬ আনা','আনা','গণ্ডা','কড়া','ক্রান্তি','তিল','ana kora','ana','gonda','kora','kranti','til'],
 a:'১ আনা = ২০ গণ্ডা, ১ গণ্ডা = ৪ কড়া, ১ কড়া = ৩ ক্রান্তি, ১ ক্রান্তি = ২০ তিল। অর্থাৎ ১ আনা = ৪,৮০০ তিল, পুরো জমি ১৬ আনা = ৭৬,৮০০ তিল।\nযেমন ৩৩ শতাংশের ৮ আনা মানে অর্ধেক, ১৬.৫ শতাংশ। আনা-কড়ার অংশ থেকে জমি আর জমি থেকে অংশ, একাধিক মালিকসহ, আনা-গণ্ডা ও হিস্যা ক্যালকুলেটরে বের হয়। সেখানে আনা-গণ্ডা-কড়া-ক্রান্তির চিহ্নের টেবিলও আছে।',b:[B.hissa,B.hisab]},
{id:'units',k:['কাঠা','বিঘা','শতাংশ','শতক','একর','বর্গফুট','ইউনিট','একক','কত কাঠা','কাঠা কত','katha','bigha','shotangsho','shotok','decimal','acre','sqft','unit','একক বদল'],
 a:'১ কাঠা = ৭২০ বর্গফুট (সরকারি মান)\n১ বিঘা = ২০ কাঠা = ১৪,৪০০ বর্গফুট (প্রায় ৩৩.০৬ শতাংশ)\n১ শতাংশ = ৪৩৫.৬ বর্গফুট\n১ একর = ১০০ শতাংশ\nকিছু এলাকায় প্রচলিত মান: ১ বিঘা = ৩৩ শতাংশ, ১ কাঠা = ১.৬৫ শতাংশ। জমির হিসাব পাতায় দুটো মানই বেছে নেওয়া যায়।\nসংখ্যাসহ লিখুন, যেমন "৩৩ শতাংশ" বা "৫ কাঠা", আমি সব এককে বদলে দেব।',b:[B.hisab],n:['৩৩ শতাংশ','৫ কাঠা']},
{id:'calc',k:['ক্যালকুলেটর','জমির হিসাব','হিসাব','ক্ষেত্রফল','এরিয়া','calculator','calculater','hisab','area','জমি মাপব কীভাবে','কিভাবে মাপব','kibhabe mapbo'],
 a:'ক্যালকুলেটর (সবগুলোর ফল প্রিন্ট বা PDF করা যায়):\n১) জমির হিসাব: আয়তক্ষেত্র, বর্গ, ত্রিভুজ, ট্রাপিজিয়াম, চতুর্ভুজ, পাঁচ বাহু, বৃত্ত, অনিয়মিত আকার; ফুট-ইঞ্চি ইনপুট; একক রূপান্তর; দাম ও ভাগ।\n২) ফারায়েজ: মুসলিম ও হিন্দু উত্তরাধিকার, মৃত সন্তানের সন্তানসহ।\n৩) আনা-গণ্ডা ও হিস্যা: খতিয়ানে একাধিক মালিকের অংশ।\n৪) দলিল ফি ও নকল তল্লাশ ফি।\nগণনা নির্ভুল সূত্রে; ফল ততটাই সঠিক, মাঠের মাপ যতটা সঠিক। সরকারি কাজে সার্ভেয়ারের সরেজমিন মাপ লাগে।',b:[B.hisab,B.faraiz,B.hissa,B.dolilfee]},
{id:'price',k:['জমির দাম','জমির মূল্য','দাম হিসাব','দাম ভাগ','প্রতি শতাংশ','jomir dam','jomi dam','dam hisab','land price'],
 a:'জমির দাম এলাকা ও অবস্থানভেদে আলাদা, তাই এখানে বাজারদর বলা যাচ্ছে না। আপনি প্রতি শতাংশের দাম জানালে জমির হিসাব পাতার "দাম ও ভাগ" ট্যাবে মোট দাম, প্রতি বর্গফুটের দাম ও সমান ভাগে প্রতি ভাগের দাম পাবেন।',b:[B.hisab]},
{id:'cost',k:['খরচ','কত টাকা','চার্জ','টাকা লাগবে','মজুরি','কত লাগবে','ফি কত','রেট','fee','cost','charge','koto taka','khoroch','khoroc','taka','rate','price koto','সেবার খরচ'],
 a:'আমাদের সেবার খরচ কাজের ধরন, মৌজা ও কাগজের অবস্থার উপর নির্ভর করে, তাই সাইটে নির্দিষ্ট দাম দেওয়া নেই। কাজের তথ্য WhatsApp-এ পাঠালে জানিয়ে দেব।\nসরকারি ফি আলাদা। যেমন নামজারিতে মোট ১,১৭০ টাকা (আবেদন ৭০ + ডিসিআর ১,১০০)। পর্চা ও খাজনার ফি পোর্টালে মিলিয়ে নিন।',b:[W('খরচ জানতে চাই','আমার কাজের খরচ জানতে চাই। কাজ: '),B.contact]},
{id:'time',k:['কতদিন','কত দিন','কয়দিন','সময় লাগবে','কবে পাব','কবে হবে','how long','duration','kotodin','koto din','koto somoy','kobe pabo'],
 a:'সময় কাজের ধরনে আলাদা। নামজারির সরকারি নিষ্পত্তি সাধারণত ২৮ দিন (বদলাতে পারে)। অন্য কাজের সময় আপনার কাগজ দেখে WhatsApp-এ জানানো হবে।',b:[B.wa]},
{id:'docs',k:['কী কাগজ','কি কাগজ','কাগজ লাগবে','কাগজপত্র','কাগজ লাগে','কি কি লাগে','documents','kagoj','kagoz','papers','required papers'],
 a:'কোন কাজে কী কাগজ, তার ওপর নির্ভর করে:\n• নামজারি: দলিল, বায়া দলিল, বিক্রেতার খতিয়ান, দাখিলা, এনআইডি (উত্তরাধিকারে ওয়ারিশান সনদ, মৃত্যু সনদ ইত্যাদি)\n• বিডিএস: সব দলিল ও জরিপের খতিয়ান, নামজারি খতিয়ান-ডিসিআর, দাখিলা, এনআইডি\n• পর্চা: মৌজা, দাগ বা খতিয়ান নম্বর, নম্বর না থাকলে মালিকের নাম\nকোন কাজের কথা জানতে চান লিখুন।',n:['নামজারি','বিডিএস কী','পর্চা কী'],b:[B.wa]},
{id:'legal',k:['আইনজীবী','উকিল','আইনি','মামলা','বিরোধ','আদালত','কোর্ট','ukil','lawyer','legal','mamla','court','law advice','আইনি পরামর্শ'],
 a:'আমাদের সাথে আইনজীবী টিম আছেন: দলিল ও কাগজ যাচাই, নামজারি ও রেকর্ড সংশোধনে শুনানির প্রস্তুতি-আপত্তি-আপিল, এবং সীমানা-দখল-ওয়ারিশ বিরোধে পরামর্শ ও আদালতের কাজে সহায়তা। নির্দিষ্ট মামলা বা বিরোধে এই সহায়কের তথ্য যথেষ্ট নয়, আইনজীবীর সাথে কথা বলুন।',b:[W('আইনজীবীর সাথে কথা','আইনজীবীর সাথে জমি সংক্রান্ত পরামর্শ করতে চাই।')]},
{id:'wrong',k:['ভুল','সংশোধন','নাম ভুল','বানান ভুল','রেকর্ড সংশোধন','আপত্তি','correction','vul','vool','wrong name','ভুল আছে'],
 a:'খতিয়ানে নাম, দাগ বা পরিমাণ ভুল থাকলে নামজারি বা রেকর্ড সংশোধনের আবেদন লাগতে পারে। জরিপের খসড়া খতিয়ান প্রকাশের সময় ভুল ধরা পড়লে নির্ধারিত ফরম ও কোর্ট ফি দিয়ে আপত্তি করা যায়; রায়ে অসন্তুষ্ট হলে আপিল। কোন ক্ষেত্রে কী লাগবে, কাগজ দেখে আমরা বলে দিই।',b:[W('ভুল সংশোধন','আমার খতিয়ানে ভুল আছে, সংশোধনে সাহায্য চাই।'),B.itihas]},
{id:'probashi',k:['প্রবাসী','বিদেশে থাকি','বিদেশ','probashi','abroad','nrb','প্রবাস'],
 a:'প্রবাসীদের জন্য: জরিপ বা নামজারির শুনানিতে নিজে না থাকলে আম-মোক্তারনামা দিয়ে প্রতিনিধি ঠিক করা যায়। আপনার ক্ষেত্রে কী করণীয়, WhatsApp-এ জানান।',b:[B.wa]},
{id:'history',k:['ইতিহাস','চিরস্থায়ী বন্দোবস্ত','জমিদার','জমিদারি','শেরশাহ','রাজস্ব','history','itihas','zamindar','jomidar','১৭৯৩','১৯৫০'],
 a:'সংক্ষেপে: শেরশাহ ও আকবর-টোডরমলের আমলে জমি মাপ ও রাজস্ব হিসাব → ১৭৯৩ চিরস্থায়ী বন্দোবস্তে জমিদাররা স্থায়ী মালিক → ১৮৮৮–১৯৪০ সিএস জরিপ → ১৯৫০ রাজ্য অধিগ্রহণ ও প্রজাস্বত্ব আইনে জমিদারি বিলোপ → পরে এসএ, আরএস, বিআরএস জরিপ → এখন অনলাইন পর্চা, ই-নামজারি, অনলাইন খাজনা ও ডিজিটাল জরিপ। বিস্তারিত ইতিহাস পাতায়।',b:[B.itihas]},
{id:'acq',k:['অধিগ্রহণ','হুকুমদখল','খাস জমি','অর্পিত','শত্রু সম্পত্তি','acquisition','khas jomi','khas land','orpito'],
 a:'ভূমি অধিগ্রহণ: রাস্তা, রেল বা সরকারি প্রকল্পের জন্য সরকার জমি নেয়; আইন অনুযায়ী নোটিশ, আপত্তির সুযোগ ও ক্ষতিপূরণ পাওয়ার অধিকার আছে।\nখাস জমি বন্দোবস্ত: সরকারের খাস জমি নীতিমালা মেনে ভূমিহীন বা যোগ্য পরিবারকে দীর্ঘমেয়াদি দেওয়া।\nঅর্পিত সম্পত্তি: ২০০১ সালের প্রত্যর্পণ আইনে তালিকাভুক্ত জমি ফেরতের আবেদনের পথ আছে। নির্দিষ্ট ক্ষেত্রে আইনজীবীর পরামর্শ নিন।',b:[B.itihas,B.wa]},
{id:'laws',k:['জমির আইন','কী কী আইন','ভূমি আইন','আইনের নাম','land law','jomir ain','ain ki','কোন আইন'],
 a:'জমি-সংক্রান্ত মূল আইন: রাজ্য অধিগ্রহণ ও প্রজাস্বত্ব আইন ১৯৫০, রেজিস্ট্রেশন আইন ১৯০৮, সম্পত্তি হস্তান্তর আইন ১৮৮২, মুসলিম-হিন্দু উত্তরাধিকার আইন, ভূমি উন্নয়ন কর আইন ও বিধি, স্থাবর সম্পত্তি অধিগ্রহণ ও হুকুমদখল আইন ২০১৭, অর্পিত সম্পত্তি প্রত্যর্পণ আইন ২০০১, ভূমি জরিপ ট্রাইব্যুনাল।',b:[B.itihas]},{id:'dcr',k:['ডিসিআর','dcr','ডুপ্লিকেট কার্বন রিসিপ্ট','duplicate carbon receipt','ডিসিআর কী','ডিসিআর আর দাখিলা','ডিসিআর ও দাখিলা','দাখিলা আর ডিসিআর','dcr ar dakhila'],
 a:'ডিসিআর (Duplicate Carbon Receipt) হলো নামজারির ফি জমার সরকারি রসিদ। নামজারি মঞ্জুর হওয়ার পর ফি দিলে ডিসিআর ও নতুন খতিয়ান পাওয়া যায়। এটি খাজনার দাখিলা থেকে আলাদা। দাখিলা হলো প্রতি বছর খাজনা দেওয়ার রসিদ।',b:[B.dcr,B.namjari]},
{id:'dolilfee',k:['দলিল ফি','রেজিস্ট্রেশন ফি','স্ট্যাম্প শুল্ক','রেজিস্ট্রি খরচ','দলিল খরচ','উৎস কর','স্থানীয় সরকার কর','dolil fee','registration fee','stamp','registry khoroch','dolil khoroch'],
 a:'সাফ কবলা রেজিস্ট্রির আনুমানিক খরচে থাকে রেজিস্ট্রেশন ফি (ধরে নেওয়া ১%), স্ট্যাম্প শুল্ক (১.৫%), স্থানীয় সরকার কর (৩%, সিটি কর্পোরেশনে ২%) ও উৎস কর (এলাকাভেদে সাধারণত ২–৫%)। হার বদলায়, তাই চূড়ান্ত হার সরকারি অফিসে যাচাই করুন। দলিল ফি ক্যালকুলেটরে হার বদলে মোট হিসাব, প্রিন্ট ও PDF পাবেন।',b:[B.dolilfee]},
{id:'nokolfee',k:['নকল তল্লাশ','তল্লাশ ফি','নকল ফি','নকলের খরচ','নকল তুলতে কত','সার্টিফাইড কপির ফি','nokol fee','nokol talash','tallash','talash fee','নকল তল্লাশি'],
 a:'দলিলের নকলে তল্লাশ ফি (প্রথম বছর ২০ টাকা, প্রতি অতিরিক্ত বছর ১৫ টাকা, একটি নাম বা সম্পত্তির জন্য সর্বোচ্চ ১৫০), পরিদর্শন ফি (১০), নকলের স্ট্যাম্প শুল্ক (১০০ বা ২০০), কোর্ট ফি (২০) এবং পাতাভিত্তিক জি(এ) ও জিজি ফি লাগে। ১০ পাতার নকলে সাধারণত প্রায় ৮৫০ টাকা। অফিস ও সময়ভেদে বদলাতে পারে।',b:[B.nokolfee,B.dolil]},
{id:'deeds',k:['সাফ কবলা','হেবা','বণ্টননামা','বায়নানামা','বন্ধক','ইজারা','মোক্তারনামা','পাওয়ার অব অ্যাটর্নি','ওসিয়ত','উইল','ত্যাগনামা','binimoy','বিনিময় দলিল','kobala','heba','bontonnama','baynanama','bondhok','izara','mokhtarnama','osiyot','বায়া দলিল','দলিলের ধরন','কী কী দলিল'],
 a:'প্রতিটি দলিলের আলাদা পেজে আছে: কী ও কখন লাগে, কী কাগজ লাগবে, কত দিনে হবে, সতর্কতা। দলিল পেজ থেকে সাফ কবলা, হেবা, হেবা বিল এওয়াজ, বণ্টননামা, বায়নানামা, বন্ধক, ইজারা, মোক্তারনামা, বিনিময়, ওসিয়তনামা ও ত্যাগনামা বেছে নিন।',b:[B.dolil,B.wa]},
{id:'angshik',k:['আংশিক খতিয়ান','angshik','partial khatian','আংশিক পর্চা','আংশিক খতিয়ান কী','আংশিক খতিয়ান কেমন','angshik khatian ki'],
 a:'আংশিক খতিয়ানে শুধু চারটি তথ্য দেখা যায়: মালিকের নাম, অভিভাবকের নাম, দাগ নম্বর ও জমির পরিমাণ। দেখা ও যাচাইয়ের জন্য সুবিধাজনক। সরকারি কাজে অনলাইন সরকারি কপি বা সার্টিফাইড কপি লাগে। পর্চা পেজে নমুনা আছে।',b:[B.porcha]}
];


/* English keywords: lets visitors ask in English too (matching is done on normalised lower-case text) */
var EK={"hello": ["hello", "hi", "hey", "assalamu alaikum"], "thanks": ["thanks", "thank you", "thx", "ok thanks"], "bot": ["are you a bot", "who are you", "are you human", "are you ai"], "about": ["about you", "who is al amin", "about al amin", "who runs this"], "contact": ["phone number", "contact number", "whatsapp number", "how to contact", "contact you", "facebook", "call you"], "where": ["where are you", "location", "service area", "which area", "do you serve", "abroad", "outside bangladesh"], "hours": ["opening hours", "office hours", "what time", "when are you available"], "services": ["what services", "your services", "what do you do", "services list", "what can you do", "services"], "porcha": ["porcha", "khatian", "land record", "how to get porcha", "land record copy", "eporcha"], "mouzabook": ["khatian book", "mouza khatian", "khatian pdf", "mouza book"], "portal": ["portal account", "land portal", "open account", "verify account", "ldtax", "land.gov.bd"], "jorip": ["cs sa rs", "survey types", "land survey", "what is cs", "what is sa", "what is rs", "brs"], "bds": ["bds", "digital survey", "bangladesh digital survey"], "khajna": ["khajna", "land tax", "land development tax", "pay tax", "dakhila", "how to pay khajna", "tax exemption"], "namjari": ["namjari", "mutation", "kharij", "namjari fee", "namjari cost", "how to do namjari"], "dolil": ["deed", "registry", "registration of deed", "land deed", "how to register"], "buycheck": ["before buying land", "buy land", "buying land checklist", "check before buying", "verify land"], "demarc": ["demarcation", "boundary marking", "boundary dispute", "measure boundary"], "mouzamap": ["mouza map", "village map", "land map"], "cad": ["autocad", "bd cad", "cad drawing", "land drawing"], "surveyor": ["surveyor", "total station", "drone survey", "levelling"], "faraiz": ["faraiz", "inheritance", "heirs", "who gets what share", "wife share", "daughter share", "partition of property", "islamic inheritance"], "anakora": ["ana gonda", "ana kora", "gonda kora kranti til", "what is ana", "ana to decimal"], "units": ["katha", "bigha", "decimal", "acre", "unit conversion", "how many decimals", "convert"], "calc": ["calculator", "calculators", "land area calculator", "area calculation"], "price": ["land price", "price of land", "price per decimal"], "cost": ["cost", "fee", "fees", "how much", "charges", "price of service", "service charge"], "time": ["how long", "how many days", "how much time", "duration"], "docs": ["what papers", "required papers", "documents needed", "papers needed"], "legal": ["lawyer", "legal advice", "court", "dispute"], "wrong": ["mistake in khatian", "wrong name", "correction", "wrong entry", "objection"], "probashi": ["expatriate", "living abroad", "nrb", "power of attorney abroad"], "history": ["land history", "history of land", "permanent settlement", "zamindar"], "acq": ["land acquisition", "khas land", "vested property", "acquisition"], "laws": ["land laws", "which laws", "land acts"], "dcr": ["dcr", "duplicate carbon receipt", "what is dcr"], "dolilfee": ["deed fee", "registration fee", "stamp duty", "registration cost", "deed cost"], "nokolfee": ["copy fee", "search fee", "certified copy fee", "deed copy cost", "nokol"], "deeds": ["sale deed", "heba", "gift deed", "partition deed", "mortgage", "lease", "power of attorney", "will", "saf kobala", "baynanama"], "angshik": ["partial khatian", "partial porcha"]};
KB.forEach(function(e){if(EK[e.id])e.k=e.k.concat(EK[e.id])});
/* index keywords once */
KB.forEach(function(e){e.kn=e.k.map(norm)});

/** Score one knowledge-base entry against the question. */
function score(e,text,toks){
 if(e.short&&toks.length>3)return 0;
 var s=0;
 e.kn.forEach(function(k){
  if(!k)return;
  if(/^[a-z0-9 ]+$/.test(k)){
   if(k.indexOf(' ')>-1){if((' '+text+' ').indexOf(' '+k+' ')>-1)s+=k.length+2;return}
   if(toks.indexOf(k)>-1){s+=k.length;return}
   if(k.length>=5){for(var i=0;i<toks.length;i++){var t=toks[i];if(/^[a-z]+$/.test(t)&&Math.abs(t.length-k.length)<=2&&lev(t,k)<=(k.length>=8?2:1)){s+=k.length*.7;return}}}
  }else if(text.indexOf(k)>-1){s+=k.length+(k.length>5?2:0)}
 });
 if(e.short&&s>0)s+=3;
 return s}

/** Format a number for the conversion answer. */
function fmt(x){if(x>=1000)return bn(Math.round(x).toLocaleString('en-US'));var t=String(+x.toFixed(3));return bn(t)}
var UNITS=[['sh','শতাংশ','শতাংশ|শতক|শতাংস|decimals?|shotangsho|shotok|shatak|shotangso'],['bi','বিঘা','বিঘা|bigha|bega'],['ka','কাঠা','কাঠা|katha|kata'],['ac','একর','একর|acres?|ekor'],['sf','বর্গফুট','বর্গ ?ফুট|sq ?ft|square ?feet|borgo ?fut'],['sm','বর্গমিটার','বর্গ ?মিটার|sq ?m|square ?meters?']];
/** Detect 'number + unit' in the question and convert it. */
function convert(text){
 for(var i=0;i<UNITS.length;i++){
  var m=new RegExp('(\\d+(?:\\.\\d+)?)\\s*('+UNITS[i][2]+')','i').exec(text);
  if(!m)continue;
  var v=parseFloat(m[1]),kk=(window.LAND&&window.LAND.kathaSf)||720,sf;
  switch(UNITS[i][0]){case'sh':sf=v*435.6;break;case'bi':sf=v*20*kk;break;case'ka':sf=v*kk;break;case'ac':sf=v*43560;break;case'sf':sf=v;break;default:sf=v*10.7639}
  return fmt(v)+' '+UNITS[i][1]+' =\n• '+fmt(sf/435.6)+' শতাংশ\n• '+fmt(sf/kk)+' কাঠা\n• '+fmt(sf/(20*kk))+' বিঘা\n• '+fmt(sf/43560)+' একর\n• '+fmt(sf)+' বর্গফুট\n• '+fmt(sf/10.7639)+' বর্গমিটার\n(১ কাঠা = '+fmt(kk)+' বর্গফুট ধরা হয়েছে। জমির হিসাব পাতায় স্থানীয় মান বেছে নেওয়া যায়।)'}
 return null}

var STARTERS=['পর্চা কী','খাজনা কীভাবে দেব','নামজারির খরচ','দলিল কেনার আগে যাচাই','ওয়ারিশ কে কত পাবে','খতিয়ান বই PDF','পোর্টাল অ্যাকাউন্ট','সেবা সমূহ'];

/** Pick the best answer (or the fallback). */
function answer(q){
 var text=norm(q),toks=text.split(' ');
 var cv=convert(text);
 if(cv)return{a:cv,b:[B.hisab],n:['১ বিঘা কত শতাংশ','ক্যালকুলেটর']};
 var best=null,bs=0,sec=null,ss=0;
 KB.forEach(function(e){var s=score(e,text,toks);if(s>bs){sec=best;ss=bs;best=e;bs=s}else if(s>ss){sec=e;ss=s}});
 if(best&&bs>=3)return{a:best.a,b:best.b||[],n:best.n||[]};
 return{a:'এই প্রশ্নের নির্দিষ্ট উত্তর আমার কাছে নেই। নিচের বিষয়গুলোর একটি বেছে নিতে পারেন, অথবা প্রশ্নটা WhatsApp-এ পাঠান, সরাসরি উত্তর পাবেন।',b:[W('প্রশ্নটা পাঠাই','আমার একটি প্রশ্ন আছে: '+q)],n:STARTERS.slice(0,5)}}

/* ---------- UI ---------- */
var P,msgs,quick,inp,btn=document.getElementById('cb'),fab=document.getElementById('fab'),openF=false,started=false;
/** Create an element. */
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var HIST=[];
/** Persist chat history in sessionStorage. */
function save(){try{sessionStorage.setItem('lbhist',JSON.stringify(HIST.slice(-40)))}catch(e){}}
/** Append a message bubble (with action buttons). */
function addMsg(text,who,acts,nosave){var m=el('div','msg '+who,text);
 if(acts&&acts.length){var d=el('div','acts');acts.forEach(function(b){var a=el('a',b.c||'',b.t);a.href=b.wa?wa(b.wa):b.h;if(b.wa||/^https?:/.test(b.h)){a.target='_blank';a.rel='noopener'}d.appendChild(a)});m.appendChild(d)}
 msgs.appendChild(m);msgs.scrollTop=msgs.scrollHeight;if(!nosave){HIST.push({t:text,w:who,a:acts||[]});save()}return m}
/** Show suggestion chips. */
function setQuick(list){quick.innerHTML='';list.forEach(function(t){var b=el('button',null,t);b.type='button';b.onclick=function(){ask(t)};quick.appendChild(b)})}
/** Handle a user question. */
function ask(q){q=String(q).trim();if(!q)return;addMsg(q,'me');inp.value='';
 var d=el('div','msg bot');d.innerHTML='<span class="dots" aria-label="লিখছি"><i></i><i></i><i></i></span>';msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
 setTimeout(function(){var r=answer(q);msgs.removeChild(d);addMsg(r.a,'bot',r.b);setQuick(r.n&&r.n.length?r.n:STARTERS)},350)}
var ICON={bot:'<rect x="4.5" y="8" width="15" height="11" rx="3.5"/><path d="M12 8V5.4"/><circle cx="12" cy="4.4" r="1.3" fill="#fff"/><circle cx="9.3" cy="13" r="1.2" fill="#fff" stroke="none"/><circle cx="14.7" cy="13" r="1.2" fill="#fff" stroke="none"/><path d="M9.6 16.3c1.4.9 3.4.9 4.8 0"/><path d="M2.5 12.5v3M21.5 12.5v3"/>',
 min:'<path d="M6 12h12"/>',up:'<path d="M6 15l6-6 6 6"/>',del:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'};
/** Create an icon button. */
function ib(icon,label,fn){var b=el('button','ib');b.type='button';b.setAttribute('aria-label',label);b.title=label;b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icon+'</svg>';b.onclick=fn;return b}
var minB;
/** Minimise or restore the panel. */
function setMin(v){P.classList.toggle('min',v);if(minB){minB.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(v?ICON.up:ICON.min)+'</svg>';minB.title=minB.ariaLabel=v?'বড় করুন':'ছোট করুন';minB.setAttribute('aria-label',v?'বড় করুন':'ছোট করুন')}if(!v&&inp)setTimeout(function(){inp.focus()},30)}
/** First greeting. */
function greet(){addMsg('আসসালামু আলাইকুম! আমি আল-আমিন ডিজিটাল ল্যান্ড সার্ভের স্বয়ংক্রিয় সহায়ক। পর্চা, খাজনা, নামজারি, দলিল, ফারায়েজ, সেবা ও খরচ নিয়ে প্রশ্ন করুন। বাংলা বা ইংরেজি হরফে (Banglish) লিখলেও চলবে।','bot');setQuick(STARTERS)}
/** Delete the conversation. */
function clearChat(){if(HIST.length>1&&!window.confirm('চ্যাটের সব বার্তা মুছে ফেলবেন?'))return;HIST=[];try{sessionStorage.removeItem('lbhist')}catch(e){}msgs.innerHTML='';greet();inp.focus()}
/** Create the chat panel. */
function build(){
 P=el('div','cbp');P.id='cbp';P.setAttribute('role','dialog');P.setAttribute('aria-label','ভূমি সহায়ক চ্যাট');
 var h=el('div','cbh');var bi=el('span','bi');bi.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+ICON.bot+'</svg>';h.appendChild(bi);
 var ti=el('div','tt','ভূমি সহায়ক');ti.appendChild(el('small',null,'স্বয়ংক্রিয় সহায়ক · সাধারণ তথ্যের জন্য'));ti.onclick=function(){if(P.classList.contains('min'))setMin(false)};h.appendChild(ti);
 h.appendChild(ib(ICON.del,'চ্যাট মুছুন',clearChat));
 minB=ib(ICON.min,'ছোট করুন',function(){setMin(!P.classList.contains('min'))});h.appendChild(minB);
 h.appendChild(ib(ICON.x,'চ্যাট বন্ধ করুন',close));P.appendChild(h);
 msgs=el('div','cbm');msgs.setAttribute('role','log');msgs.setAttribute('aria-live','polite');P.appendChild(msgs);
 quick=el('div','cbq');P.appendChild(quick);
 var f=el('form','cbf');inp=el('input');inp.type='text';inp.placeholder='প্রশ্ন লিখুন (বাংলা বা Banglish)';inp.setAttribute('aria-label','আপনার প্রশ্ন');inp.autocomplete='off';
 var s=el('button',null,'পাঠান');s.type='submit';f.appendChild(inp);f.appendChild(s);f.onsubmit=function(e){e.preventDefault();ask(inp.value)};P.appendChild(f);
 P.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
 document.body.appendChild(P);
 try{HIST=JSON.parse(sessionStorage.getItem('lbhist')||'[]')}catch(e){HIST=[]}
 if(HIST.length){HIST.forEach(function(m){addMsg(m.t,m.w,m.a,true)});setQuick(STARTERS);started=true}}
/** Open the chat panel. */
function open(){if(!P)build();P.hidden=false;openF=true;fab.classList.add('open');btn.setAttribute('aria-expanded','true');setMin(false);
 if(!started){started=true;greet()}
 setTimeout(function(){inp.focus()},50)}
/** Close the chat panel. */
function close(){if(P)P.hidden=true;openF=false;fab.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.focus()}
window.LandBot={kb:KB,toggle:function(){openF?close():open()},open:open,close:close,answer:answer};
})();
