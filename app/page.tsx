"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Moon,
  Sun,
  Users,
  GraduationCap,
  BookOpen,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";
import { useTheme } from "next-themes";
import { BackgroundBeams } from "@/components/background-beams";
import { DirectionChart } from "@/components/direction-chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Cell,
  Label,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface ApplicationStats {
  totalApplications: number;
  byEducationLevel: Array<{ name: string; count: number }>;
  byProgram: Array<{ name: string; count: number; level: string }>;
  byStudyForm: Array<{ name: string; count: number }>;
  byPaymentType: Array<{ name: string; count: number }>;
  byGender: Array<{ name: string; count: number }>;
  byCitizenship: Array<{ name: string; count: number }>;
  byEducationDocument: Array<{ name: string; count: number }>;
  byGraduationYear: Array<{ name: string; count: number }>;
  byStream: Array<{ name: string; count: number }>;
  bySource: Array<{ name: string; count: number }>;
  programDetails: Array<{
    program: string;
    level: string;
    studyForm: string;
    paymentType: string;
    count: number;
  }>;
  lastUpdated: string;
}

// Константы
const ADMISSION_PLAN = {
  "Магистратура_Психология_Очно-заочная_Платно": 15,
  Магистратура_Менеджмент_Заочная_Платно: 15,
  Бакалавриат_Психология_Очная_Бюджет: 10,
  Бакалавриат_Психология_Очная_Платно: 55,
  "Бакалавриат_Психология_Очно-заочная_Бюджет": 6,
  "Бакалавриат_Психология_Очно-заочная_Платно": 54,
  Бакалавриат_Менеджмент_Очная_Бюджет: 37,
  Бакалавриат_Менеджмент_Очная_Платно: 28,
  "Бакалавриат_Социальная работа_Очная_Бюджет": 10,
  "Бакалавриат_Социальная работа_Очная_Платно": 15,
  "Бакалавриат_Социальная работа_Заочная_Бюджет": 4,
  "Бакалавриат_Социальная работа_Заочная_Платно": 68,
  Бакалавриат_Юриспруденция_Очная_Бюджет: 10,
  Бакалавриат_Юриспруденция_Очная_Платно: 55,
} as const;

const chartConfig = {
  applications: {
    label: "Заявления",
    color: "hsl(var(--chart-1))",
  },
};

const STREAM_SORT_ORDER = [
  "17 июля (11.00)",
  "17 июля (14.00)",
  "15 августа (11.00)",
  "15 августа (14.00)",
  "23 июля (МАГ)",
  "30 июля (МАГ)",
  "15 августа (МАГ)",
  "22 августа (МАГ)",
];

function AdmissionsDashboard() {
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Подготовка данных для графиков по направлениям
  const { budgetPrograms, paidPrograms } = useMemo(() => {
    if (!stats) {
      return { budgetPrograms: [], paidPrograms: [] };
    }

    const budgetMap: Record<string, number> = {};
    const paidMap: Record<string, number> = {};

    stats.programDetails.forEach((item) => {
      if (item.paymentType === "да") {
        budgetMap[item.program] = (budgetMap[item.program] || 0) + item.count;
      } else if (item.paymentType === "нет") {
        paidMap[item.program] = (paidMap[item.program] || 0) + item.count;
      }
    });

    const budgetPrograms = Object.entries(budgetMap).map(([name, count]) => ({
      name,
      count,
    }));
    const paidPrograms = Object.entries(paidMap).map(([name, count]) => ({
      name,
      count,
    }));

    return { budgetPrograms, paidPrograms };
  }, [stats]);

  // Состояние для переключения между бюджетами и платными
  const [activeTab, setActiveTab] = useState<"budget" | "paid">("budget");

  // Подготовка данных для Radial Chart
  const { genderData, totalGender, chartConfigGender } = useMemo(() => {
    if (!stats) {
      return {
        genderData: [],
        totalGender: 0,
        chartConfigGender: {},
      };
    }

    // Собираем данные по полу
    const maleCount =
      stats.byGender.find(
        (g) =>
          g.name.toLowerCase().includes("муж") ||
          g.name.toLowerCase().includes("m")
      )?.count || 0;

    const femaleCount =
      stats.byGender.find(
        (g) =>
          g.name.toLowerCase().includes("жен") ||
          g.name.toLowerCase().includes("f")
      )?.count || 0;

    const total = maleCount + femaleCount;

    return {
      genderData: [
        {
          male: maleCount,
          female: femaleCount,
        },
      ],
      totalGender: total,
      chartConfigGender: {
        male: {
          label: "Мужской",
          color: "hsl(var(--male))",
        },
        female: {
          label: "Женский",
          color: "hsl(var(--female))",
        },
      },
    };
  }, [stats]);

  // Конфигурация для графика
  const chartConfig = {
    applications: {
      label: "Заявления",
      color: "hsl(var(--chart-1))",
    },
  };

  // Мемоизированные функции
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion-stats", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setStats(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      setError(error instanceof Error ? error.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const getApplicationCount = useCallback(
    (
      level: string,
      program?: string,
      studyForm?: string,
      paymentType?: string
    ) => {
      if (!stats) return 0;

      return stats.programDetails.reduce((sum, item) => {
        const levelMatch = item.level === level;
        const programMatch = !program || item.program === program;
        const formMatch = !studyForm || item.studyForm === studyForm;
        let paymentMatch = true;
        if (paymentType) {
          paymentMatch =
            (paymentType === "Бюджет" && item.paymentType === "да") ||
            (paymentType === "Платно" && item.paymentType === "нет");
        }
        return levelMatch && programMatch && formMatch && paymentMatch
          ? sum + item.count
          : sum;
      }, 0);
    },
    [stats]
  );

  const getAdmissionPlan = useCallback(
    (
      level: string,
      program: string,
      studyForm: string,
      paymentType: string
    ) => {
      const key =
        `${level}_${program}_${studyForm}_${paymentType}` as keyof typeof ADMISSION_PLAN;
      return ADMISSION_PLAN[key] || 0;
    },
    []
  );

  const getCompetitionRatio = useCallback(
    (applications: number, plan: number) => {
      if (plan === 0) return "_";
      return (applications / plan).toFixed(1);
    },
    []
  );

  // Мемоизированные вычисления
  const sortedStreamData = useMemo(() => {
    if (!stats) return [];
    return stats.byStream.sort((a, b) => {
      const indexA = STREAM_SORT_ORDER.indexOf(a.name);
      const indexB = STREAM_SORT_ORDER.indexOf(b.name);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }, [stats]);

  const bachelorApplicationsCount = useMemo(
    () => getApplicationCount("Бакалавриат"),
    [getApplicationCount]
  );
  const masterApplicationsCount = useMemo(
    () => getApplicationCount("Магистратура"),
    [getApplicationCount]
  );

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative">
        <BackgroundBeams className="absolute inset-0 z-0" />
        <div className="text-center relative z-10">
          <LoaderCircle className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground text-sm sm:text-lg font-medium">
            Загрузка данных приёмной комиссии...
          </p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative">
        <BackgroundBeams className="absolute inset-0 z-0" />
        <div className="text-center relative z-10">
          <div className="text-destructive mb-4 text-xl font-semibold">
            Ошибка загрузки данных
          </div>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button
            onClick={fetchStats}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundBeams className="absolute inset-0 z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90 z-[1]" />

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50 md:block hidden">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90"
          onClick={toggleTheme}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Переключить тему</span>
        </Button>
      </div>

      <div className="fixed bottom-6 right-6 z-50 md:hidden block">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90"
          onClick={toggleTheme}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Переключить тему</span>
        </Button>
      </div>

      <main className="container mx-auto px-2 md:px-4 pt-8 md:pt-12 relative z-20">
        {stats && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <h1 className="text-2xl md:text-6xl font-bold text-muted-foreground mb-1">
                    Приёмная Комиссия 2025
                  </h1>
                  <p className="text-sm md:text-lg text-primary font-semibold text-center px-4">
                    Российский Государственный Социальный Университет в г.
                    Минске
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-muted-foreground mr-0.5" />
                    <span className="text-xs text-center text-muted-foreground">
                      Обновлено: {lastRefresh.toLocaleString("ru-RU")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">
                    Всего заявлений
                  </CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {stats.totalApplications}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Общее количество поданных документов
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">
                    Бакалавриат
                  </CardTitle>
                  <GraduationCap className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {bachelorApplicationsCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Заявлений на программы бакалавриата
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">
                    Магистратура
                  </CardTitle>
                  <BookOpen className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {masterApplicationsCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Заявлений на программы магистратуры
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs для переключения между уровнями образования */}
            <Tabs defaultValue="bachelor" className="mb-12">
              <TabsList className="grid items-center justify-center grid-cols-2 bg-muted border-border/50 mb-6 mx-auto w-10/12 sm:w-3/12 rounded-full">
                <TabsTrigger
                  value="bachelor"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-0 rounded-full"
                >
                  Бакалавриат
                </TabsTrigger>
                <TabsTrigger
                  value="master"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
                >
                  Магистратура
                </TabsTrigger>
              </TabsList>

              {/* Бакалавриат */}
              <TabsContent value="bachelor" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {/* Менеджмент */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Менеджмент • Очная
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Бюджет:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Менеджмент",
                              "Очная",
                              "Бюджет"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Менеджмент",
                              "Очная",
                              "Бюджет"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Менеджмент",
                                "Очная",
                                "Бюджет"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Менеджмент",
                                "Очная",
                                "Бюджет"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Менеджмент",
                              "Очная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Менеджмент",
                              "Очная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Менеджмент",
                                "Очная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Менеджмент",
                                "Очная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Психология Очная */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Психология • Очная
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Бюджет:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Психология",
                              "Очная",
                              "Бюджет"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Психология",
                              "Очная",
                              "Бюджет"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Психология",
                                "Очная",
                                "Бюджет"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Психология",
                                "Очная",
                                "Бюджет"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Психология",
                              "Очная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Психология",
                              "Очная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Психология",
                                "Очная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Психология",
                                "Очная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Психология Очно-заочная */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Психология • Очно-заочная
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Бюджет:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Психология",
                              "Очно-заочная",
                              "Бюджет"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Психология",
                              "Очно-заочная",
                              "Бюджет"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Психология",
                                "Очно-заочная",
                                "Бюджет"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Психология",
                                "Очно-заочная",
                                "Бюджет"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Психология",
                              "Очно-заочная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Психология",
                              "Очно-заочная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Психология",
                                "Очно-заочная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Психология",
                                "Очно-заочная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Социальная работа Очная */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Социальная работа • Очная
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Бюджет:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Социальная работа",
                              "Очная",
                              "Бюджет"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Социальная работа",
                              "Очная",
                              "Бюджет"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Социальная работа",
                                "Очная",
                                "Бюджет"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Социальная работа",
                                "Очная",
                                "Бюджет"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Социальная работа",
                              "Очная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Социальная работа",
                              "Очная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Социальная работа",
                                "Очная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Социальная работа",
                                "Очная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Социальная работа Заочная */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Социальная работа • Заочная
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Бюджет:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Социальная работа",
                              "Заочная",
                              "Бюджет"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Социальная работа",
                              "Заочная",
                              "Бюджет"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Социальная работа",
                                "Заочная",
                                "Бюджет"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Социальная работа",
                                "Заочная",
                                "Бюджет"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Социальная работа",
                              "Заочная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Социальная работа",
                              "Заочная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Социальная работа",
                                "Заочная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Социальная работа",
                                "Заочная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Юриспруденция Очная */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Юриспруденция • Очная
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Бюджет:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Юриспруденция",
                              "Очная",
                              "Бюджет"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Юриспруденция",
                              "Очная",
                              "Бюджет"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Юриспруденция",
                                "Очная",
                                "Бюджет"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Юриспруденция",
                                "Очная",
                                "Бюджет"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Бакалавриат",
                              "Юриспруденция",
                              "Очная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Бакалавриат",
                              "Юриспруденция",
                              "Очная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Бакалавриат",
                                "Юриспруденция",
                                "Очная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Бакалавриат",
                                "Юриспруденция",
                                "Очная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Магистратура */}
              <TabsContent value="master" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Психология Очно-заочная */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Психология • Очно-заочная
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Магистратура",
                              "Психология",
                              "Очно-заочная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Магистратура",
                              "Психология",
                              "Очно-заочная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Магистратура",
                                "Психология",
                                "Очно-заочная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Магистратура",
                                "Психология",
                                "Очно-заочная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Менеджмент Заочная */}
                  <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-lg font-semibold text-primary">
                        Менеджмент • Заочная
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center p-3 bg-muted/70 rounded-lg">
                        <span className="text-sm font-medium text-card-foreground">
                          Платно:
                        </span>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-primary">
                            {getApplicationCount(
                              "Магистратура",
                              "Менеджмент",
                              "Заочная",
                              "Платно"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            План:{" "}
                            {getAdmissionPlan(
                              "Магистратура",
                              "Менеджмент",
                              "Заочная",
                              "Платно"
                            )}{" "}
                            | Конкурс:{" "}
                            {getCompetitionRatio(
                              getApplicationCount(
                                "Магистратура",
                                "Менеджмент",
                                "Заочная",
                                "Платно"
                              ),
                              getAdmissionPlan(
                                "Магистратура",
                                "Менеджмент",
                                "Заочная",
                                "Платно"
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Графики */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* График по потоку */}
              {/* Скрыт 
              <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-primary">
                    Распределение по потоку
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Количество заявлений по потокам поступления
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart
                      data={sortedStreamData}
                      accessibilityLayer
                      margin={{ top: 20, right: 0, left: 0, bottom: 0 }} // Увеличили отступы
                    >
                      <CartesianGrid vertical={false} strokeOpacity={0.3} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={10}
                        interval={0}
                      />                      
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel={false} />}
                      />
                      <Bar
                        dataKey="count"
                        fill="var(--color-applications)"
                        radius={8}
                      >                        
                        <LabelList
                          position="top"
                          offset={10}
                          className="fill-muted-foreground font-bold"
                          fontSize={12}
                          formatter={(value: number) =>
                            value > 0 ? value : ""
                          } // Не показывать 0
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card> 
            */}
              
              {/* Radial Chart - Stacked для распределения по полу 
              <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="space-y-0 flex flex-row items-start justify-between pb-4 ">
                  <div>
                    <CardTitle className="text-xl font-semibold text-primary">
                      Распределение по направлениям
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Количество заявлений по направлениям подготовки
                    </p>
                  </div>

                  <div className="flex absolute top-0 right-0 overflow-hidden h-8 sm:h-16 rounded-bl-lg">
                    <button
                      onClick={() => setActiveTab("budget")}
                      className={`
                        px-4 text-xs sm:text-sm font-medium transition-colors flex items-center
                        ${
                        activeTab === "budget"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-muted"
                        }
                      `}
                    >
                      Бюджет
                    </button>
                    <div className="w-px bg-border"></div>
                    <button
                      onClick={() => setActiveTab("paid")}
                      className={`
                        px-4 text-xs sm:text-sm font-medium transition-colors flex items-center
                        ${
                          activeTab === "paid"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-foreground hover:bg-muted"
                        }
                      `}
                    >
                      Платно
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    {activeTab === "budget" ? (
                      <BarChart
                        data={budgetPrograms}
                        title="Бюджетные направления"
                        description="Количество заявлений на бюджетные места по направлениям"
                        accessibilityLayer
                        margin={{ top: 20, right: 0, left: 0, bottom: 0 }} // Увеличили отступы
                      >
                        <CartesianGrid vertical={false} strokeOpacity={0.3} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={10}
                          interval={0}
                        />                        
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel={false} />}
                        />
                        <Bar
                          dataKey="count"
                          fill="var(--color-applications)"
                          radius={8}
                        >                          
                          <LabelList
                            position="top"
                            offset={10}
                            className="fill-foreground font-bold"
                            fontSize={12}
                            formatter={(value: number) =>
                              value > 0 ? value : ""
                            } // Не показывать 0
                          />
                        </Bar>
                      </BarChart>
                    ) : (
                      <BarChart
                        data={paidPrograms}
                        title="Платные направления"
                        description="Количество заявлений на платные места по направлениям"
                        accessibilityLayer
                        margin={{ top: 20, right: 0, left: 0, bottom: 0 }} // Увеличили отступы
                      >
                        <CartesianGrid vertical={false} strokeOpacity={0.3} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={10}
                          interval={0}
                        />                        
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel={false} />}
                        />
                        <Bar
                          dataKey="count"
                          fill="var(--color-applications)"
                          radius={8}
                        >                          
                          <LabelList
                            position="top"
                            offset={10}
                            className="fill-foreground font-bold"
                            fontSize={12}
                            formatter={(value: number) =>
                              value > 0 ? value : ""
                            } // Не показывать 0
                          />
                        </Bar>
                      </BarChart>
                    )}
                  </ChartContainer>
                </CardContent>
              </Card>
              */}

              {/* Radial Chart - Stacked для распределения по полу */}
              <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-primary">
                    Распределение по полу
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Соотношение мужчин и женщин среди абитуриентов
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center pb-0 min-h-[300px] md:min-h-[350px]">
                  <ChartContainer
                    config={chartConfigGender}
                    className="aspect-square w-full max-w-[300px] mx-auto"
                  >
                    <RadialBarChart
                      data={genderData}
                      endAngle={180}
                      innerRadius={80}
                      outerRadius={120}
                      barSize={24}
                    >
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <PolarRadiusAxis
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  className="font-inter"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) - 16}
                                    className="fill-foreground text-2xl md:text-3xl font-bold"
                                  >
                                    {totalGender}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 4}
                                    className="fill-muted-foreground text-sm"
                                  >
                                    Абитуриенты
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </PolarRadiusAxis>
                      <RadialBar
                        dataKey="male"
                        stackId="a"
                        cornerRadius={5}
                        fill="var(--color-male)"
                        className="stroke-transparent stroke-2"
                      />
                      <RadialBar
                        dataKey="female"
                        stackId="a"
                        cornerRadius={5}
                        fill="var(--color-female)"
                        className="stroke-transparent stroke-2"
                      />
                    </RadialBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* График "Откуда узнали" */}
              <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-primary">
                    Источники информации
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Откуда абитуриенты узнали об университете
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <PieChart>
                      <Pie
                        data={stats.bySource}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={75}
                        innerRadius={45}
                        fill="var(--color-applications)"
                        dataKey="count"
                      >
                        {stats.bySource.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Footer информация */}
            <div className="text-center py-6 border-t border-border/30">
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium">
                  Данные обновляются автоматически каждые 30 минут
                </p>
                <p>
                  Последнее обновление: {lastRefresh.toLocaleString("ru-RU")}
                </p>
                {error && (
                  <p className="text-destructive font-medium">
                    Последняя ошибка: {error}
                  </p>
                )}
                <p className="text-xs opacity-75 mt-4">
                  © 2025 РГСУ Минск • Приёмная комиссия
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Экспортируем компонент как default export
export default AdmissionsDashboard;
