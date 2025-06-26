export const getMockData = () => {
  const mockData = {
    totalApplications: 150,
    byEducationLevel: [
      { name: "Бакалавриат", count: 100 },
      { name: "Магистратура", count: 50 },
    ],
    byProgram: [
      { name: "Менеджмент", count: 40 },
      { name: "Психология", count: 35 },
      { name: "Социальная работа", count: 30 },
      { name: "Юриспруденция", count: 45 },
    ],
    byStudyForm: [
      { name: "Очная", count: 80 },
      { name: "Очно-заочная", count: 40 },
      { name: "Заочная", count: 30 },
    ],
    byPaymentType: [
      { name: "Бюджет", count: 70 },
      { name: "Платно", count: 80 },
    ],
    programDetails: [
      {
        program: "Менеджмент",
        level: "Бакалавриат",
        studyForm: "Очная",
        paymentType: "Бюджет",
        count: 15,
      },
      {
        program: "Психология",
        level: "Бакалавриат",
        studyForm: "Очная",
        paymentType: "Платно",
        count: 20,
      },
      {
        program: "Социальная работа",
        level: "Магистратура",
        studyForm: "Заочная",
        paymentType: "Бюджет",
        count: 10,
      },
      {
        program: "Юриспруденция",
        level: "Бакалавриат",
        studyForm: "Очно-заочная",
        paymentType: "Платно",
        count: 25,
      },
      {
        program: "Менеджмент",
        level: "Магистратура",
        studyForm: "Очная",
        paymentType: "Платно",
        count: 10,
      },
    ],
    lastUpdated: new Date().toISOString(),
  }

  return mockData
}
