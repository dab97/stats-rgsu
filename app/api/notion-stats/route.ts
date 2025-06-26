import { Client } from "@notionhq/client"
import type { NextRequest } from "next/server"

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

interface NotionApplication {
  id: string
  program: string
  level: string
  studyForm: string
  paymentType: string
  submittedAt: string
  gender: string
  citizenship: string
  educationDocument: string
  graduationYear: string
  stream: string
  source: string
}

// Кэш для данных
let cachedData: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 минуты

async function fetchNotionData() {
  try {
    // Проверяем кэш
    const now = Date.now();
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      console.log("Возвращаем данные из кэша");
      return cachedData;
    }

    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
      console.log("Используются mock данные - переменные окружения не настроены");
      const mockData = getMockData();
      cachedData = mockData;
      cacheTimestamp = now;
      return mockData;
    }

    // Пагинация для получения всех записей
    let allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100,
      });

      allResults = [...allResults, ...response.results];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    console.log(`Всего записей получено: ${allResults.length}`);

    const applications: NotionApplication[] = allResults.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        program: getPropertyValue(props["Приоритетное направление"]) || "",
        level: getPropertyValue(props["Вид образования"]) || "",
        studyForm: getPropertyValue(props["Форма обучения"]) || "",
        paymentType: getPropertyValue(props["Бюджет"]) || "",
        submittedAt: getPropertyValue(props["Start Time"]) || "",
        gender: getPropertyValue(props["Пол"]) || "",
        citizenship: getPropertyValue(props["Гражданство"]) || "",
        educationDocument: getPropertyValue(props["Документ об образовании"]) || "",
        graduationYear: getPropertyValue(props["Год выдачи"]) || "",
        stream: getPropertyValue(props["Поток (Русский)"]) || "",
        source: getPropertyValue(props["Откуда узнали о нас?"]) || "",
      };
    });

    const aggregatedData = aggregateStats(applications);
    cachedData = aggregatedData;
    cacheTimestamp = now;
    return aggregatedData;
  } catch (error) {
    console.error("Ошибка получения данных из Notion:", error);
    console.log("Используются mock данные из-за ошибки");
    const mockData = getMockData();
    cachedData = mockData;
    cacheTimestamp = Date.now();
    return mockData;
  }
}

function getPropertyValue(property: any): string {
  if (!property) return ""

  switch (property.type) {
    case "select":
      return property.select?.name || ""
    case "multi_select":
      return property.multi_select?.map((item: any) => item.name).join(", ") || ""
    case "rich_text":
      return property.rich_text?.map((text: any) => text.plain_text).join("") || ""
    case "title":
      return property.title?.map((text: any) => text.plain_text).join("") || ""
    case "date":
      return property.date?.start || ""
    case "created_time":
      return property.created_time || ""
    case "number":
      return property.number?.toString() || ""
    case "phone_number":
      return property.phone_number || ""
    case "email":
      return property.email || ""
    case "checkbox":
      return property.checkbox ? "да" : "нет"
    default:
      return ""
  }
}

function getMockData() {
  const mockApplications: NotionApplication[] = [
    // Бакалавриат - Менеджмент
    ...Array(89)
      .fill(null)
      .map((_, i) => ({
        id: `mock-${i}`,
        program: "Менеджмент",
        level: "Бакалавриат",
        studyForm: "Очная",
        paymentType: i % 2 === 0 ? "да" : "нет",
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        gender: i % 2 === 0 ? "Мужской" : "Женский",
        citizenship: "Беларусь",
        educationDocument: "Аттестат",
        graduationYear: "2024",
        stream: [
          "17 июля (11.00)",
          "17 июля (14.00)",
          "15 августа (11.00)",
          "15 августа (14.00)",
          "23 июля (МАГ)",
          "30 июля (МАГ)",
          "15 августа (МАГ)",
          "22 августа (МАГ)",
        ][i % 8],
        source: ["Интернет", "Друзья", "Реклама", "Социальные сети"][i % 4],
      })),
    // Бакалавриат - Психология
    ...Array(76)
      .fill(null)
      .map((_, i) => ({
        id: `mock-${i + 89}`,
        program: "Психология",
        level: "Бакалавриат",
        studyForm: i < 38 ? "Очная" : "Очно-заочная",
        paymentType: i % 3 === 0 ? "да" : "нет",
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        gender: i % 3 === 0 ? "Мужской" : "Женский",
        citizenship: "Беларусь",
        educationDocument: "Аттестат",
        graduationYear: "2024",
        stream: [
          "17 июля (11.00)",
          "17 июля (14.00)",
          "15 августа (11.00)",
          "15 августа (14.00)",
          "23 июля (МАГ)",
          "30 июля (МАГ)",
          "15 августа (МАГ)",
          "22 августа (МАГ)",
        ][i % 8],
        source: ["Интернет", "Друзья", "Реклама", "Социальные сети"][i % 4],
      })),
    // Бакалавриат - Социальная работа
    ...Array(54)
      .fill(null)
      .map((_, i) => ({
        id: `mock-${i + 165}`,
        program: "Социальная работа",
        level: "Бакалавриат",
        studyForm: ["Очная", "Заочная"][i % 2],
        paymentType: i % 4 === 0 ? "да" : "нет",
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        gender: i % 2 === 0 ? "Мужской" : "Женский",
        citizenship: "Беларусь",
        educationDocument: "Аттестат",
        graduationYear: "2024",
        stream: [
          "17 июля (11.00)",
          "17 июля (14.00)",
          "15 августа (11.00)",
          "15 августа (14.00)",
          "23 июля (МАГ)",
          "30 июля (МАГ)",
          "15 августа (МАГ)",
          "22 августа (МАГ)",
        ][i % 8],
        source: ["Интернет", "Друзья", "Реклама", "Социальные сети"][i % 4],
      })),
    // Бакалавриат - Юриспруденция
    ...Array(67)
      .fill(null)
      .map((_, i) => ({
        id: `mock-${i + 219}`,
        program: "Юриспруденция",
        level: "Бакалавриат",
        studyForm: "Очная",
        paymentType: i % 3 === 0 ? "да" : "нет",
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        gender: i % 2 === 0 ? "Мужской" : "Женский",
        citizenship: "Беларусь",
        educationDocument: "Аттестат",
        graduationYear: "2024",
        stream: [
          "17 июля (11.00)",
          "17 июля (14.00)",
          "15 августа (11.00)",
          "15 августа (14.00)",
          "23 июля (МАГ)",
          "30 июля (МАГ)",
          "15 августа (МАГ)",
          "22 августа (МАГ)",
        ][i % 8],
        source: ["Интернет", "Друзья", "Реклама", "Социальные сети"][i % 4],
      })),
    // Магистратура - Менеджмент (1 заявление)
    {
      id: `mock-mag-1`,
      program: "Менеджмент",
      level: "Магистратура",
      studyForm: "Заочная",
      paymentType: "нет",
      submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      gender: "Мужской",
      citizenship: "Беларусь",
      educationDocument: "Диплом",
      graduationYear: "2023",
      stream: "30 июля (МАГ)",
      source: "Интернет",
    },
    // Магистратура - Психология (1 заявление)
    {
      id: `mock-mag-2`,
      program: "Психология",
      level: "Магистратура",
      studyForm: "Очно-заочная",
      paymentType: "нет",
      submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      gender: "Женский",
      citizenship: "Беларусь",
      educationDocument: "Диплом",
      graduationYear: "2023",
      stream: "23 июля (МАГ)",
      source: "Друзья",
    },
  ]

  return aggregateStats(mockApplications)
}

function aggregateStats(applications: NotionApplication[]) {
  const stats = {
    totalApplications: applications.length,
    byEducationLevel: {} as Record<string, number>,
    byProgram: {} as Record<string, number>,   
    byStudyForm: {} as Record<string, number>,
    byPaymentType: {} as Record<string, number>,
    byGender: {} as Record<string, number>,
    byCitizenship: {} as Record<string, number>,
    byEducationDocument: {} as Record<string, number>,
    byGraduationYear: {} as Record<string, number>,
    byStream: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    programDetails: [] as Array<{
      program: string
      level: string
      studyForm: string
      paymentType: string
      count: number
    }>,
  }

  // Временный объект для группировки
  const programDetailsMap: Record<string, number> = {};

  applications.forEach((app) => {
    // Подсчет по уровням образования
    if (app.level) {
      stats.byEducationLevel[app.level] = (stats.byEducationLevel[app.level] || 0) + 1
    }

    // Подсчет по программам
    if (app.program) {
      stats.byProgram[app.program] = (stats.byProgram[app.program] || 0) + 1
    }

    // Подсчет по форме обучения
    if (app.studyForm) {
      stats.byStudyForm[app.studyForm] = (stats.byStudyForm[app.studyForm] || 0) + 1
    }

    // Подсчет по типу оплаты
    if (app.paymentType) {
      stats.byPaymentType[app.paymentType] = (stats.byPaymentType[app.paymentType] || 0) + 1
    }

    // Подсчет по полу
    if (app.gender) {
      stats.byGender[app.gender] = (stats.byGender[app.gender] || 0) + 1
    }

    // Подсчет по гражданству
    if (app.citizenship) {
      stats.byCitizenship[app.citizenship] = (stats.byCitizenship[app.citizenship] || 0) + 1
    }

    // Подсчет по документу об образовании
    if (app.educationDocument) {
      stats.byEducationDocument[app.educationDocument] = (stats.byEducationDocument[app.educationDocument] || 0) + 1
    }

    // Подсчет по году выпуска
    if (app.graduationYear) {
      stats.byGraduationYear[app.graduationYear] = (stats.byGraduationYear[app.graduationYear] || 0) + 1
    }

    // Подсчет по потоку
    if (app.stream) {
      stats.byStream[app.stream] = (stats.byStream[app.stream] || 0) + 1
    }

    // Подсчет по источнику информации
    if (app.source) {
      stats.bySource[app.source] = (stats.bySource[app.source] || 0) + 1
    }

    // Группировка по деталям программы
    if (app.program && app.level && app.studyForm && app.paymentType) {
      // Используем подчеркивание вместо дефиса для ключа
      const key = `${app.level}_${app.program}_${app.studyForm}_${app.paymentType}`;
            if (!programDetailsMap[key]) {
        programDetailsMap[key] = 0;
      }
      programDetailsMap[key] += 1;
    }
  })
  // Преобразуем в массив объектов
  stats.programDetails = Object.entries(programDetailsMap).map(([key, count]) => {
    const [level, program, studyForm, paymentType] = key.split('_');
    return { program, level, studyForm, paymentType, count };
  });  

  return {
    totalApplications: stats.totalApplications,
    byEducationLevel: Object.entries(stats.byEducationLevel).map(([name, count]) => ({ name, count })),
    byProgram: Object.entries(stats.byProgram).map(([name, count]) => ({
      name,
      count,
      level: applications.find((app) => app.program === name)?.level || "",
    })),
    byStudyForm: Object.entries(stats.byStudyForm).map(([name, count]) => ({ name, count })),
    byPaymentType: Object.entries(stats.byPaymentType).map(([name, count]) => ({ name, count })),
    byGender: Object.entries(stats.byGender).map(([name, count]) => ({ name, count })),
    byCitizenship: Object.entries(stats.byCitizenship).map(([name, count]) => ({ name, count })),
    byEducationDocument: Object.entries(stats.byEducationDocument).map(([name, count]) => ({ name, count })),
    byGraduationYear: Object.entries(stats.byGraduationYear).map(([name, count]) => ({ name, count })),
    byStream: Object.entries(stats.byStream).map(([name, count]) => ({ name, count })),
    bySource: Object.entries(stats.bySource).map(([name, count]) => ({ name, count })),
    programDetails: stats.programDetails,
    lastUpdated: new Date().toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = await fetchNotionData()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, s-maxage=120", // Кэш на 2 минуты
        ETag: `"${Date.now()}"`,
      },
    })
  } catch (error) {
    console.error("Ошибка получения данных:", error)
    return new Response(
      JSON.stringify({
        error: "Ошибка получения данных",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
