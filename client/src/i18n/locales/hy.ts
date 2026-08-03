/** Eastern Armenian (արևելահայերեն) UI catalog — namespaced for future per-screen splits. */
export const hy = {
  'common.brand': 'Մեջբերումներ Աստվածաշնչից',
  'common.save': 'Պահպանել',
  'common.saving': 'Պահպանվում է…',
  'common.error': 'Սխալ',
  'common.ok': 'Լավ',
  'common.cancel': 'Չեղարկել',
  'common.delete': 'Ջնջել',
  'common.loading': 'Բեռնվում է…',
  'common.optional': 'ոչ պարտադիր',
  'common.note': 'Նշում',
  'common.back': 'Հետ',
  'common.reload': 'Թարմացնել էջը',

  'errors.generic': 'Ինչ-որ բան սխալ ընթացավ։ Խնդրում ենք կրկին փորձել։',
  'errors.network':
    'Չհաջողվեց կապ հաստատել սերվերի հետ։ Ստուգեք ինտերնետը և կրկին փորձեք։',
  'errors.server':
    'Սերվերի ժամանակավոր խնդիր է առաջացել։ Խնդրում ենք մի փոքր ուշ կրկին փորձել։',
  'errors.unauthorized': 'Խնդրում ենք կրկին մուտք գործել։',
  'errors.forbidden':
    'Դուք չունեք այս գործողությունը կատարելու թույլտվություն։',
  'errors.notFound': 'Պահանջված տվյալները չեն գտնվել։',
  'errors.rateLimited':
    'Չափից շատ հարցումներ։ Խնդրում ենք մի փոքր սպասել և կրկին փորձել։',

  'tabs.citations': 'Մեջբերումներ',
  'tabs.submit': 'Ուղարկել',
  'tabs.settings': 'Կարգավորումներ',
  'tabs.profile': 'Պրոֆիլ',

  'auth.login.title': 'Բարի գալուստ',
  'auth.login.subtitle':
    'Մուտք գործեք կամ ստեղծեք Ձեր անձնական հաշիվը՝ Ձեր նախընտրած կարգավորումները հետագայում վերականգնելու համար:',
  'auth.login.email': 'Էլ․ փոստ',
  'auth.login.password': 'Գաղտնաբառ',
  'auth.login.passwordPlaceholder': 'Մուտքագրեք Ձեր գաղտնաբառը',
  'auth.login.submit': 'Մուտք',
  'auth.login.submitting': 'Խնդրում ենք սպասել...',
  'auth.login.forgot': 'Մոռացե՞լ եք գաղտնաբառը',
  'auth.login.noAccount': 'Հաշիվ չունե՞ք',
  'auth.login.createOne': 'Գրանցվել',
  'auth.login.google': 'Գրանցվել Google-ի միջոցով',
  'auth.login.failed': 'Մուտքը ձախողվեց',
  'auth.login.googleFailed': 'Google մուտքը ձախողվեց',

  'auth.register.title': 'Ստեղծել հաշիվ',
  'auth.register.subtitle':
    'Գրանցվեք՝ Ձեր նախընտրած կարգավորումները հետագայում վերականգնելու համար:',
  'auth.register.name': 'Անուն',
  'auth.register.namePlaceholder': 'Մուտքագրեք Ձեր անունը',
  'auth.register.passwordPlaceholder': 'Մուտքագրեք Ձեր գաղտնաբառը',
  'auth.register.confirmPassword': 'Կրկնել գաղտնաբառը',
  'auth.register.confirmPasswordPlaceholder': 'Կրկին մուտքագրեք գաղտնաբառը',
  'auth.register.submit': 'Ստեղծել հաշիվ',
  'auth.register.submitting': 'Ստեղծվում է…',
  'auth.register.hasAccount': 'Ունե՞ք հաշիվ',
  'auth.register.signIn': 'Մուտք',
  'auth.register.failed': 'Գրանցումը ձախողվեց',

  'auth.checkEmail.title': 'Էլ․ փոստն ուղարկված է',
  'auth.checkEmail.body':
    'Հաստատման հղում ենք ուղարկել {email} հասցեին։ Բացեք էլ․ փոստը և սեղմեք կոճակը՝ հաշիվն ակտիվացնելու համար։',
  'auth.checkEmail.resend': 'Կրկին ուղարկել էլ․ փոստը',
  'auth.checkEmail.resending': 'Ուղարկվում է…',
  'auth.checkEmail.resent': 'Էլ․ փոստը կրկին ուղարկված է։',
  'auth.checkEmail.resendFailed': 'Չհաջողվեց կրկին ուղարկել էլ․ փոստը',
  'auth.checkEmail.goLogin': 'Անցնել մուտքին',
  'auth.checkEmail.back': 'Վերադառնալ գրանցմանը',

  'auth.forgot.title': 'Վերականգնել գաղտնաբառը',
  'auth.forgot.subtitle':
    'Մուտքագրեք էլ․ փոստը, և մենք կուղարկենք վերականգնման հղումը:',
  'auth.forgot.submit': 'Ուղարկել հղումը',
  'auth.forgot.submitting': 'Ուղարկվում է…',
  'auth.forgot.back': 'Վերադառնալ',
  'auth.forgot.failed': 'Հարցումը ձախողվեց',
  'auth.forgotSent.title': 'Էլ․ փոստն ուղարկված է',
  'auth.forgotSent.body':
    'Եթե {email} հասցեով հաշիվը գոյություն ունի, մենք ուղարկել ենք գաղտնաբառի վերականգնման հղումը։ Խնդրում ենք՝ ստուգեք Ձեր էլ․ փոստը և հետևեք հրահանգներին։',
  'auth.forgotSent.goLogin': 'Անցնել մուտքին',
  'auth.forgotSent.back': 'Վերադառնալ',

  'auth.reset.title': 'Նոր գաղտնաբառ',
  'auth.reset.subtitle': 'Մուտքագրեք նոր գաղտնաբառը Ձեր հաշվի համար',
  'auth.reset.newPassword': 'Նոր գաղտնաբառ',
  'auth.reset.confirmPassword': 'Կրկնել գաղտնաբառը',
  'auth.reset.confirmPasswordPlaceholder': 'Կրկին մուտքագրեք նոր գաղտնաբառը',
  'auth.reset.submit': 'Թարմացնել գաղտնաբառը',
  'auth.reset.submitting': 'Պահպանվում է…',
  'auth.reset.invalidLink':
    'Անվավեր վերականգնման հղում։ Հավելվածից կատարեք նոր հղման հարցում։',
  'auth.reset.failed': 'Վերականգնումը ձախողվեց',
  'auth.resetSuccess.title': 'Գաղտնաբառը փոխված է',
  'auth.resetSuccess.body':
    'Ձեր գաղտնաբառը հաջողությամբ փոխվել է։ Այժմ կարող եք մուտք գործել նոր գաղտնաբառով։',
  'auth.resetSuccess.goLogin': 'Մուտք գործել նոր գաղտնաբառով',

  'auth.loggedOut.title': 'Դուրս եք եկել',
  'auth.loggedOut.body':
    'Դուք հաջողությամբ դուրս եք եկել Ձեր հաշվից այս սարքում։',
  'auth.loggedOut.goLogin': 'Մուտք գործել',

  'auth.accountDeleted.title': 'Հաշիվը ջնջված է',
  'auth.accountDeleted.body': 'Ձեր հաշիվը և կապված տվյալները ջնջված են։',
  'auth.accountDeleted.goLogin': 'Մուտք գործել',

  'auth.verify.title': 'Էլ․ փոստի հաստատում',
  'auth.verify.invalidLink': 'Անվավեր հաստատման հղում։',
  'auth.verify.failed': 'Հաստատումը ձախողվեց',
  'auth.verify.goLogin': 'Անցնել մուտքին',
  'auth.skip': 'Գրանցվել հետո',

  'guest.signInRequiredTitle': 'Անհրաժեշտ է մուտք գործել համակարգ',
  'guest.signInRequiredBody':
    'Այս բաժինն օգտագործելու համար խնդրում ենք գրանցվել կամ մուտք գործել Ձեր հաշիվ։',
  'guest.signIn': 'Մուտք գործել',

  'citations.title': 'Իմ մեջբերումները',
  'citations.emptyBody': 'Այս բաժնում ընդգրկված մեջբերումներ չկան։',
  'citations.loadFailed':
    'Չհաջողվեց բեռնել մեջբերումները։ Խնդրում ենք կրկին փորձել։',
  'citations.filterAll': 'Բոլորը',
  'citations.filterSaved': 'Պահված',
  'citations.filterPending': 'Դիտարկվում է',
  'citations.filterApproved': 'Հաստատված',
  'citations.filterPrivate': 'Անձնական',
  'citations.filterSavedHint': 'Մեջբերումներ, որոնք պահպանել եք:',
  'citations.filterPendingHint':
    'Ձեր ուղարկած մեջբերումները, որոնք սպասում են վերանայման և հաստատման։',
  'citations.filterApprovedHint':
    'Ձեր մեջբերումները, որոնք հաստատվել են և հասանելի են հանրային շտեմարանում։',
  'citations.filterPrivateHint':
    'Մեջբերումներ, որոնք ավելացրել եք դուք և հասանելի են միայն Ձեզ:',

  'submit.title': 'Ավելացնել մեջբերում',
  'submit.ctaTitle': 'Ավելացրեք նոր մեջբերում',
  'submit.ctaBody':
    'Կիսվեք Ձեր սիրելի հատվածով, կամ վերանայեք ստորև Ձեր ուղարկումները։',
  'submit.addNew': 'Ավելացնել մեջբերում',
  'submit.heroBody':
    'Ուղարկեք Ձեր մեջբերումները Աստվածաշնչից կամ այլ գրական ստեղծագործություններից: Ուղարկված հարցումները վերանայվում են մեր կողմից․ հաստատման դեպքում դրանք կհայտնվեն ընդհանուր շտեմարանում և կցուցադրվեն մյուս օգտատերերի վիդջեթների վրա ևս։',
  'submit.conditionsNoteBefore': 'Հաստատման համար պետք է ապահովվեն բոլոր ',
  'submit.conditionsLink': 'պայմանները',
  'submit.conditionsNoteAfter': '։',
  'submit.pendingHint': 'Հարցումները սպասում են վերանայման',
  'submit.missingTextTitle': 'Բացակայում է տեքստը',
  'submit.missingTextBody': 'Խնդրում ենք մուտքագրել մեջբերման տեքստը։',
  'submit.savedTitle': 'Պահված է',
  'submit.submittedTitle': 'Ուղարկված է',
  'submit.savedBody': 'Պահված է Ձեր անձնական ցուցակում։',
  'submit.submittedBody': 'Ուղարկված է վերանայման։',
  'submit.viewSubmissions': 'Դիտել մեջբերումները',
  'submit.failed':
    'Չհաջողվեց ուղարկել մեջբերումը․ խնդրում ենք փորձել ևս մեկ անգամ կամ կապվեք մեզ հետ։',
  'submit.savePrivate': 'Պահել իմ ցուցակում',
  'submit.forReview': 'Ուղարկել վերանայման',
  'submit.submitting': 'Ուղարկվում է…',
  'submit.loadFailed': 'Չհաջողվեց բեռնել ուղարկումները',
  'submit.deleteTitle': 'Ջնջել մեջբերումը',
  'submit.deleteBody': 'Սա հնարավոր չէ հետարկել։',
  'submit.deleteAction': 'Ջնջել',
  'submit.citationUpdated': 'Մեջբերումը թարմացված է։',
  'submit.citationPendingReview':
    'Փոփոխությունները պահված են։ Մեջբերումը սպասում է վերանայման։',
  'submit.updateCitationFailed': 'Չհաջողվեց թարմացնել մեջբերումը',

  'approvalConditions.title': 'Հաստատման պայմաններ',
  'approvalConditions.intro':
    'Հանրային հավաքածուում հայտնվելու համար ուղարկված մեջբերումը պետք է համապատասխանի ստորև նշված պայմաններին։',
  'approvalConditions.requirementsHeading': 'Պարտադիր պայմաններ',
  'approvalConditions.reqExactMatch':
    'Մեջբերման տեքստը պետք է ճշգրիտ համընկնի նշված աղբյուրում եղած բնագրի հետ։',
  'approvalConditions.reqValidSource':
    'Աղբյուրը կամ հեղինակը պետք է լինի վավեր և ստուգելի (օր․՝ գրքի անուն, Աստվածաշնչի հատված)։',
  'approvalConditions.reqArmenian': 'Մեջբերումը պետք է լինի հայերեն։',
  'approvalConditions.reqNotDuplicate':
    'Մեջբերումը չպետք է կրկնվի՝ նույն կամ շատ նման տեքստը չպետք է արդեն իսկ լինի առկա հավաքածուի մեջ։',
  'approvalConditions.notesHeading': 'Լրացուցիչ նշումներ',
  'approvalConditions.noteEdit':
    'Հաստատման ժամանակ մեջբերումը կարող է փոքր-ինչ խմբագրվել՝ պարզության կամ ոճի համար, առանց իմաստը փոխելու։',
  'approvalConditions.noteBeautify':
    'Հնարավոր է նաև ձևաչափման կամ կետադրության ճշգրտում՝ որպեսզի մեջբերումը ավելի ընթեռնելի լինի հավելվածում։',
  'form.citationText': 'Մեջբերման տեքստ',
  'form.citationPlaceholder': 'Մուտքագրեք տեքստը',
  'form.source': 'Աղբյուր',
  'form.sourcePlaceholder': 'օր․՝ Ծննդոց 1:1',
  'form.category': 'Կատեգորիա',
  'form.categoryBible': 'Աստվածաշունչ',
  'form.categoryFiction': 'Գրականություն',

  'category.bible': 'Աստվածաշունչ',
  'category.fiction': 'Գրականություն',

  'profile.title': 'Պրոֆիլ',
  'profile.avatarAlt': 'Օգտատիրոջ նկարը',
  'profile.name': 'Անուն',
  'profile.socialUrl': 'Սոց․ / հղում',
  'profile.saveChanges': 'Պահպանել փոփոխությունները',
  'profile.signOut': 'Դուրս գալ',
  'profile.signOutConfirmTitle': 'Դուրս գա՞լ հաշվից',
  'profile.signOutConfirmBody': 'Դուք կդուրս գաք Ձեր հաշվից այս սարքում։',
  'profile.removeAccount': 'Ջնջել հաշիվը',
  'profile.removeAccountConfirmTitle': 'Ջնջե՞լ հաշիվը',
  'profile.removeAccountConfirmBody':
    'Այս գործողությունը անդառնալի է։ Ձեր հաշիվը և բոլոր տվյալները վերջնականապես կջնջվեն։',
  'profile.removeAccountFailed': 'Չհաջողվեց ջնջել հաշիվը',
  'profile.updated': 'Պրոֆիլը թարմացված է։',
  'profile.loadFailed': 'Չհաջողվեց բեռնել պրոֆիլը',
  'profile.updateFailed': 'Չհաջողվեց թարմացնել պրոֆիլը',
  'profile.contactUs': 'կապվեք մեզ հետ',
  'profile.contactPrompt':
    'Եթե ունեք հավելվածի հետ կապված հարցեր, առաջարկներ կամ խնդիրներ, խնդրում ենք՝ {link}։',

  'contact.title': 'Կապ մեզ հետ',
  'contact.intro':
    'Գրեք մեզ՝ հարցերի, առաջարկների կամ խնդիրների մասին։ Մենք կպատասխանենք հնարավորինս շուտ։',
  'contact.fullName': 'Անուն Ազգանուն',
  'contact.email': 'Հետադարձ Էլ․ փոստ',
  'contact.message': 'Հաղորդագրություն',
  'contact.messagePlaceholder': 'Գրեք Ձեր հաղորդագրությունը…',
  'contact.send': 'Ուղարկել',
  'contact.sending': 'Ուղարկվում է…',
  'contact.sendFailed': 'Չհաջողվեց ուղարկել հաղորդագրությունը',
  'contact.successTitle': 'Հաղորդագրությունն ուղարկված է',
  'contact.successBody':
    'Շնորհակալություն։ Մենք ստացել ենք Ձեր նամակը և կպատասխանենք հնարավորինս շուտ։',
  'contact.backToProfile': 'Վերադառնալ պրոֆիլ',

  'settings.title': 'Վիջեթի կարգավորումներ',
  'settings.sourcePool': 'Աղբյուրների ընտրություն',
  'settings.refreshRate': 'Թարմացման հաճախականություն',
  'settings.typography': 'Տառատեսակ',
  'settings.fontSize': 'Տառաչափ',
  'settings.displayOptions': 'Ցուցադրման կարգավորումներ',
  'settings.attribution': 'Ցույց տալ մեջբերումն ավելացրած օգտատիրոջ անունը',
  'settings.showActions': 'Ցույց տալ գործողությունների կոճակները',
  'settings.showActionsDesc':
    'Ցույց տալ նոր մեջբերման, պահպանման և կիսվելու կոճակները վիջեթի ներքևի հատվածում։',
  'settings.shareProfile': 'Ցույց տալ իմ պրոֆիլը այլ օգտատերերի վիջեթներում',
  'settings.shareProfileDesc':
    'Երբ միացված է, Ձեր անունը և սոց․ հղումը կարող են երևալ այլ օգտատերերի վիջեթներում՝ Ձեր ավելացրած մեջբերումների վրա։ Խմբագրեք անունը և հղումը պրոֆիլում։',
  'settings.actionSaveSuccess': 'Մեջբերումը պահպանվեց',
  'settings.actionSaveFailed': 'Չհաջողվեց պահպանել մեջբերումը',
  'settings.attributionDesc':
    'Վիջեթի ներքևում ցույց է տալիս «Ավելացվել է [Անունը]-ի կողմից»',
  'settings.refresh6': '6 ժամը մեկ',
  'settings.refresh12': '12 ժամը մեկ',
  'settings.refresh24': 'Ամեն օր',
  'settings.poolBible': 'Աստվածաշունչ',
  'settings.poolFiction': 'Գրականություն',
  'settings.poolMixed': 'Խառը',
  'settings.poolSaved': 'Պահված',
  'settings.preview': 'Նախադիտում',
  'settings.livePreview': 'Նախադիտում',
  'settings.previewLoading': 'Մեջբերումը բեռնվում է…',
  'settings.previewEmpty':
    'Ընտրված աղբյուրից մեջբերումներ չկան․ աղբյուրը փոխելու համար անցեք կարգավորումների էջ։',
  'settings.designLabel': 'Վիջեթի դիզայն',
  'settings.designClassic': 'Դասական',
  'settings.designParchment': 'Մագաղաթ',
  'settings.designMidnight': 'Կեսգիշեր',
  'settings.designNoir': 'Մութ',
  'settings.designFrost': 'Ցրտաշունչ',
  'settings.designSanctuary': 'Սրբավայր',
  'settings.addedBy': 'Ավելացվել է {name}-ի կողմից',
  'settings.actionRefresh': 'Թարմացնել',
  'settings.actionSettings': 'Կարգավորումներ',
  'settings.actionBookmark': 'Էջանշել',
  'settings.actionShare': 'Կիսվել',
  'settings.shareCardFooter': 'Մեջբերումներ Աստվածաշնչից',
  'settings.shareFailed': 'Չհաջողվեց կիսվել մեջբերմամբ',
  'settings.saved': 'Կարգավորումները պահված են։',
  'settings.saveFailed': 'Չհաջողվեց պահպանել կարգավորումները',
  'settings.loadFailed': 'Չհաջողվեց բեռնել կարգավորումները',

  'tutorial.openButton': 'Ինչպես ավելացնել վիջեթը էկրանին',
  'tutorial.close': 'Փակել',
  'tutorial.next': 'Հաջորդը',
  'tutorial.done': 'Ավարտել',
  'tutorial.stepCount': '{current} / {total}',
  'tutorial.osIos': 'iPhone',
  'tutorial.osAndroid': 'Android',
  'tutorial.welcome.title': 'Բարի գալուստ',
  'tutorial.welcome.body':
    'Հավելվածի միջոցով կարող եք Ձեր հեռախոսի հիմնական էկրանին տեղադրվել վիջեթ, որոնց վրա կցուցադրվեն մեջբերումներ Աստավածաշնչից և տարբեր գրական ստեղծագործություններից։ Հետևեք հետևյալ քայլերին՝ վիջեթն էկրանի վրա տեղադրելու համար։',
  'tutorial.longPress.title': 'Ինչպես տեղադրել վիջեթը էկրանին',
  'tutorial.longPress.appIcon.title': 'Երկար սեղմեք հավելվածի նշանի վրա',
  'tutorial.longPress.appIcon.body':
    'Մատը երկար սեղմած պահեք հավելվածի նշանի վրա:',
  'tutorial.longPress.or': 'կամ',
  'tutorial.longPress.homeScreen.title': 'Երկար սեղմեք հիմնական էկրանին',
  'tutorial.longPress.homeScreen.body':
    'Բացեք Ձեր հեռախոսի հիմնական էկրանը և մատը երկար պահեք դատարկ տեղում, մինչև հայտնվի կարգավորումների ընտրացանկը։',
  'tutorial.ios.addMenu.title': 'Սեղմեք «+» կոճակը',
  'tutorial.ios.addMenu.body':
    'Էկրանի վերևի ձախ անկյունում հայտնված «+» կոճակը կբացի վիջեթների պատուհանը։',
  'tutorial.android.addMenu.title': 'Ընտրեք «Վիջեթներ»',
  'tutorial.android.addMenu.body':
    'Հայտնված ցանկից ընտրեք «Վիջեթներ» կետը՝ հասանելի վիջեթների ցանկը բացելու համար։',
  'tutorial.ios.chooseSize.title': 'Գտեք հավելվածը և ընտրեք չափսը',
  'tutorial.ios.chooseSize.body':
    'Որոնման դաշտում մուտքագրեք «{appName}», սահեցրեք՝ ցանկալի չափսն ընտրելու համար, ապա սեղմեք «Ավելացնել վիջեթը»։',
  'tutorial.android.dragToScreen.title': 'Քաշեք վիջեթը էկրան',
  'tutorial.android.dragToScreen.body':
    'Ցանկում գտեք «{appName}» հավելվածը, մատը երկար պահեք դրա նախադիտման վրա և քաշեք այն հիմնական էկրան։',
  'tutorial.ios.placeAndDone.title': 'Տեղադրեք և ավարտեք',
  'tutorial.ios.placeAndDone.body':
    'Քաշեք վիջեթը ցանկալի տեղը և սեղմեք «Պատրաստ է»։ Չափսը փոխելու համար հեռացրեք վիջեթը և կրկին ավելացրեք այլ չափսով։',
  'tutorial.android.resize.title': 'Փոխեք չափսը',
  'tutorial.android.resize.body':
    'Մատը երկար պահեք արդեն տեղադրված վիջեթի վրա, ապա քաշեք կապույտ սահմանագծերը՝ չափսը մեծացնելու կամ փոքրացնելու համար։',
  'tutorial.customize.title': 'Պատրաստ է',
  'tutorial.customize.body':
    'Ահա թե ինչպիսին կլինի Ձեր վիջեթը։ «Կարգավորումներ» բաժնում կարող եք փոխել աղբյուրը, մեջբերման ավտոմատ փոփոխման հաճախականությունը, վիդջեթի դիզայնը և տառատեսակը։',

  'status.pending': 'Սպասում է հաստատման',
  'status.approved': 'Հաստատված',
  'status.rejected': 'Մերժված',
  'status.private': 'Մասնավոր',
  'card.removeSaved': 'Հեռացնել պահվածներից',
  'card.removeSavedConfirmTitle': 'Հեռացնե՞լ մեջբերումը',
  'card.removeSavedConfirmBody': 'Այն կհեռացվի Ձեր պահվածների ցանկից։',
  'card.removePending': 'Հեռացնել ուղարկվածներից',
  'card.removePrivate': 'Հեռացնել անձնականներից',
  'card.removeApproved': 'Հեռացնել հաստատվածներից',
  'card.saveCitation': 'Պահել մեջբերումը',
  'card.remove': 'ՀԵՌԱՑՆԵԼ',
  'card.unknownSource': 'Անհայտ աղբյուր',
  'card.submittedRecent': 'Ուղարկված է վերջերս',
  'card.editSubmission': 'Խմբագրել ուղարկումը',
  'card.deleteSubmission': 'Ջնջել ուղարկումը',

  'validation.emailRequired': 'էլ․ փոստը լրացնելը պարտադիր է',
  'validation.emailInvalid': 'Մուտքագրեք վավեր էլ․ փոստ',
  'validation.passwordRequired': 'Մուտքագրեք գաղտնաբառը',
  'validation.passwordMin': 'Գաղտնաբառը պետք է լինի առնվազն 8 նիշ',
  'validation.passwordMax': 'Գաղտնաբառը չի կարող գերազանցել 128 նիշը',
  'validation.passwordLower':
    'Գաղտնաբառը պետք է պարունակի առնվազն մեկ փոքրատառ լատինատառ',
  'validation.passwordUpper':
    'Գաղտնաբառը պետք է պարունակի առնվազն մեկ մեծատառ լատինատառ',
  'validation.passwordNumber': 'Գաղտնաբառը պետք է պարունակի առնվազն մեկ թիվ',
  'validation.passwordConfirmRequired': 'Կրկին մուտքագրեք գաղտնաբառը',
  'validation.passwordMismatch': 'Գաղտնաբառները չեն համընկնում',
  'validation.nameRequired': 'Մուտքագրեք անունը',
  'validation.nameMin': 'Անունը պետք է լինի առնվազն 2 նիշ',
  'validation.nameMax': 'Անունը չի կարող գերազանցել 100 նիշը',
  'validation.namePattern':
    'Անունը կարող է պարունակել միայն տառեր, բացատներ, գծիկներ և ապաթարցեր',
  'validation.citationTextRequired': 'Մուտքագրեք մեջբերման տեքստը',
  'validation.citationTextMax': 'Մեջբերումը չի կարող գերազանցել 400 նիշը',
  'validation.sourceRequired': 'Մուտքագրեք աղբյուրը',
  'validation.sourceMax': 'Աղբյուրը չի կարող գերազանցել 200 նիշը',
  'validation.socialUrlInvalid':
    'Մուտքագրեք վավեր հղում (սկսած http:// կամ https://)',
  'validation.socialUrlMax': 'Հղումը չի կարող գերազանցել 300 նիշը',
  'validation.messageRequired': 'Մուտքագրեք հաղորդագրությունը',
  'validation.messageMax': 'Հաղորդագրությունը չի կարող գերազանցել 4000 նիշը',
} as const

export type HyMessages = typeof hy
