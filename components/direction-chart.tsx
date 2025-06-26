"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DirectionChartProps {
  data: { name: string; count: number }[]
  title: string
  description: string
  color: string
}

export function DirectionChart({ data, title, description, color }: DirectionChartProps) {
  // Сортируем данные по количеству заявлений (по убыванию)
  const sortedData = [...data].sort((a, b) => b.count - a.count)
  
  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="vertical"
            >
              <CartesianGrid horizontal={false} strokeOpacity={0.3} />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tickLine={false}
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent hideLabel={false} />} 
              />
              <Bar 
                dataKey="count" 
                fill={color} 
                radius={[0, 4, 4, 0]}
              >
                <LabelList 
                  dataKey="count" 
                  position="right" 
                  className="fill-foreground font-bold" 
                  fontSize={12} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
