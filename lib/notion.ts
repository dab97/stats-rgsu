// Утилиты для работы с Notion API
// Установите @notionhq/client: npm install @notionhq/client

import { Client } from "@notionhq/client"

// Инициализация клиента Notion
export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// Функция для получения данных из базы данных Notion
export async function getApplicationsFromNotion() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      // Можно добавить фильтры и сортировку
      filter: {
        property: "Status",
        select: {
          equals: "Подано",
        },
      },
    })

    // Обработка данных из Notion
    const applications = response.results.map((page: any) => ({
      id: page.id,
      program: page.properties.Program?.select?.name || "",
      studyForm: page.properties.StudyForm?.select?.name || "",
      paymentType: page.properties.PaymentType?.select?.name || "",
      submittedAt: page.properties.SubmittedAt?.date?.start || "",
      // Добавьте другие необходимые поля
    }))

    return applications
  } catch (error) {
    console.error("Ошибка получения данных из Notion:", error)
    throw error
  }
}

// Функция для агрегации статистики
export function aggregateStats(applications: any[]) {
  const stats = {
    totalApplications: applications.length,
    byProgram: {} as Record<string, number>,
    byStudyForm: {} as Record<string, number>,
    byPaymentType: {} as Record<string, number>,
  }

  applications.forEach((app) => {
    // Подсчет по программам
    stats.byProgram[app.program] = (stats.byProgram[app.program] || 0) + 1

    // Подсчет по форме обучения
    stats.byStudyForm[app.studyForm] = (stats.byStudyForm[app.studyForm] || 0) + 1

    // Подсчет по типу оплаты
    stats.byPaymentType[app.paymentType] = (stats.byPaymentType[app.paymentType] || 0) + 1
  })

  return {
    totalApplications: stats.totalApplications,
    byProgram: Object.entries(stats.byProgram).map(([name, count]) => ({ name, count })),
    byStudyForm: Object.entries(stats.byStudyForm).map(([name, count]) => ({ name, count })),
    byPaymentType: Object.entries(stats.byPaymentType).map(([name, count]) => ({ name, count })),
    lastUpdated: new Date().toISOString(),
  }
}
