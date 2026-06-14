import {
  ColorType,
  createChart,
  BaselineSeries,
  LineType,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { onCleanup, onMount, createEffect } from "solid-js";

interface ChartProps {
  data: { time: number; value: number }[];
}

export function Chart(props: ChartProps) {
  let container!: HTMLDivElement;
  let chart: IChartApi | null = null;
  let series: ISeriesApi<"Baseline"> | null = null;

  onMount(() => {
    chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9399b2",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#45475a", style: LineStyle.Dotted },
        horzLines: { color: "#45475a", style: LineStyle.Dotted },
      },
      rightPriceScale: { borderColor: "#313244" },
      timeScale: {
        borderColor: "#313244",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "#6c7086",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#45475a",
        },
        horzLine: {
          color: "#6c7086",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#45475a",
        },
      },
    });

    series = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: 0.5 },
      topLineColor: "#a6e3a1",
      topFillColor1: "rgba(166, 227, 161, 0.20)",
      topFillColor2: "rgba(166, 227, 161, 0.02)",
      bottomLineColor: "#f38ba8",
      bottomFillColor1: "rgba(243, 139, 168, 0.02)",
      bottomFillColor2: "rgba(243, 139, 168, 0.20)",
      lineWidth: 2,
      lineType: LineType.WithSteps,
      priceLineVisible: false,
      priceFormat: {
        type: "custom",
        formatter: (p: number) => Math.round(p * 100) + "%",
        minMove: 0.01,
      },
      autoscaleInfoProvider: () => ({
        priceRange: { minValue: 0, maxValue: 1 },
      }),
    });

    series.setData(props.data);
    chart.timeScale().fitContent();
    onCleanup(() => chart?.remove());
  });

  createEffect(() => {
    if (!series) return;
    series.setData(props.data);
    chart?.timeScale().fitContent();
  });

  return <div ref={container} class="w-full h-48" />;
}
