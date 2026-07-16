export const AUTH_VALIDATION = {
  email: {
    maxLength: 255,
    messages: {
      required: "Մուտքագրեք էլ․ փոստը",
      invalid: "Մուտքագրեք վավեր էլ․ փոստ",
    },
  },
  password: {
    minLength: 8,
    maxLength: 128,
    patterns: {
      lowercase: /[a-z]/,
      uppercase: /[A-Z]/,
      number: /[0-9]/,
    },
    messages: {
      required: "Մուտքագրեք գաղտնաբառը",
      minLength: "Գաղտնաբառը պետք է լինի առնվազն 8 նիշ",
      maxLength: "Գաղտնաբառը չի կարող գերազանցել 128 նիշը",
      lowercase: "Գաղտնաբառը պետք է պարունակի առնվազն մեկ փոքրատառ լատինատառ",
      uppercase: "Գաղտնաբառը պետք է պարունակի առնվազն մեկ մեծատառ լատինատառ",
      number: "Գաղտնաբառը պետք է պարունակի առնվազն մեկ թիվ",
    },
  },
  name: {
    minLength: 2,
    maxLength: 100,
    /** Unicode letters (incl. Armenian), spaces, hyphens, apostrophes */
    pattern: /^[\p{L}\s'-]+$/u,
    messages: {
      required: "Մուտքագրեք անունը",
      minLength: "Անունը պետք է լինի առնվազն 2 նիշ",
      maxLength: "Անունը չի կարող գերազանցել 100 նիշը",
      pattern: "Անունը կարող է պարունակել միայն տառեր, բացատներ, գծիկներ և ապաթարցեր",
    },
  },
  token: {
    messages: {
      required: "Թոքենը պարտադիր է",
    },
  },
} as const;
