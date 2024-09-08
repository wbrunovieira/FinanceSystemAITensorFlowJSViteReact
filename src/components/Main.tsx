import React, {
    useEffect,
    useCallback,
    useState,
    useRef,
    FormEvent,
} from "react";

import Highcharts from "highcharts/highstock";
import axios from "axios";
import HighchartsReact from "highcharts-react-official";
import * as tf from "@tensorflow/tfjs";

import { SMA, RSI, stochastic, seasonality, EMA } from "../technicalindicators";
import stockMarketDataDaily from "../../stockMarketDataDaily.json";

interface StockData {
    [key: string]: {
        "1. open": string;
        "2. high": string;
        "3. low": string;
        "4. close": string;
        "5. volume": string;
    };
}

interface MetaData {
    "2. Symbol": string;
}

interface DataPoint {
    [key: string]: string | number;
}

interface DimensionParams {
    mean: number;
    std: number;
}

interface FlagType {
    type?: string;
    label?: string;
}

const Main = () => {
    const [data, setData] = useState<[string, DataPoint][]>([]);
    const [series, setSeries] = useState<any[]>([]);
    const [isModelTraining, setIsModelTraining] = useState(false);
    const [modelLogs, setModelLogs] = useState<[number, number][]>([]);
    const [modelResultTraining, setModelResultTraining] = useState<any>(null);
    const modelLogsRef = useRef<[number, number][]>([]);
    const [investing, setInvesting] = useState({
        start: 1000,
        end: null as number | null,
    });
    const [dataEma10, setDataEma10] = useState<number[] | null>(null);
    const [dataEma20, setDataEma20] = useState<number[] | null>(null);
    const [dataEma50, setDataEma50] = useState<number[] | null>(null);
    const [dataSma10, setDataSma10] = useState<number[] | null>(null);
    const [dataSma20, setDataSma20] = useState<number[] | null>(null);
    const [dataSma50, setDataSma50] = useState<number[] | null>(null);
    const [dataSma100, setDataSma100] = useState<number[] | null>(null);
    const [dataRsi7, setDataRsi7] = useState<number[] | null>(null);
    const [dataRsi14, setDataRsi14] = useState<number[] | null>(null);
    const [dataRsi28, setDataRsi28] = useState<number[] | null>(null);
    const [dataStochastic7, setDataStochastic7] = useState<number[] | null>(
        null
    );
    const [dataStochastic14, setDataStochastic14] = useState<number[] | null>(
        null
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [symbol, setSymbol] = useState<string>("");
    const [sampleData, setSampleData] = useState<any>(null);
    const [graphTitle, setGraphTitle] = useState<string | null>(null);
    const [recurrence, setRecurrence] = useState<number>(24);
    const [strategy, setStrategy] = useState<number>(2);
    const [isPredictionLoading, setIsPredictionLoading] = useState(false);

    const epochs = 7;
    const timeserieSize = recurrence;
    const batchSize = 32;

    useEffect(() => {
        const areAllDataReady =
            data.length > 0 &&
            dataEma10 &&
            dataEma20 &&
            dataEma50 &&
            dataSma10 &&
            dataSma20 &&
            dataSma50 &&
            dataSma100 &&
            dataRsi7 &&
            dataRsi14 &&
            dataRsi28 &&
            dataStochastic7 &&
            dataStochastic14;

        if (areAllDataReady) {
            const sampleDataRaw = splitData([0, 1]).map(
                (e: [string, number[]]) => e[1]
            );
            const {
                dataNormalized: sampleDataNormalized,
                dimensionParams: sampleDimensionParams,
            } = normalizeData(sampleDataRaw, null);

            setSampleData({
                sampleDataRaw: JSON.parse(JSON.stringify(sampleDataRaw))
                    .reverse()
                    .filter((_: number[], i: number) => i < 5),
                sampleDimensionParams,
            });
        }
    }, [
        data,
        dataEma10,
        dataEma20,
        dataEma50,
        dataSma10,
        dataSma20,
        dataSma50,
        dataSma100,
        dataRsi7,
        dataRsi14,
        dataRsi28,
        dataStochastic7,
        dataStochastic14,
    ]);

    useEffect(() => {
        if (data.length) {
            const closePrices = data.map((d) => Number(d[1]["4. close"]));
            setDataStochastic7(
                stochastic({
                    period: 7,
                    data: closePrices,
                })
            );
            setDataStochastic14(
                stochastic({
                    period: 14,
                    data: closePrices,
                })
            );
            setDataRsi7(
                RSI({
                    period: 7,
                    data: closePrices,
                })
            );
            setDataRsi14(
                RSI({
                    period: 14,
                    data: closePrices,
                })
            );
            setDataRsi28(
                RSI({
                    period: 28,
                    data: closePrices,
                })
            );
            setDataSma10(
                SMA({
                    period: 10,
                    data: closePrices,
                })
            );
            setDataSma20(
                SMA({
                    period: 20,
                    data: closePrices,
                })
            );
            setDataSma50(
                SMA({
                    period: 50,
                    data: closePrices,
                })
            );
            setDataEma10(
                EMA({
                    period: 10,
                    data: closePrices,
                })
            );
            setDataEma20(
                EMA({
                    period: 20,
                    data: closePrices,
                })
            );
            setDataEma50(
                EMA({
                    period: 50,
                    data: closePrices,
                })
            );
            setDataSma100(
                SMA({
                    period: 100,
                    data: closePrices,
                })
            );
        }
    }, [data]);

    useEffect(() => {
        setData(
            Object.entries(
                stockMarketDataDaily["Time Series (Daily)"] as StockData
            ).sort(
                (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
            )
        );
        setGraphTitle(
            (stockMarketDataDaily["Meta Data"] as MetaData)["2. Symbol"]
        );
    }, []);

    useEffect(() => {
        if (
            data.length &&
            series.findIndex((serie) => serie.name === "Stock value") === -1
        ) {
            setSeries([
                ...series,
                {
                    type: "area",
                    id: "dataseries",
                    name: "Stock value",
                    data: data.map((serie) => [
                        new Date(serie[0]).getTime(),
                        Number(serie[1]["4. close"]),
                    ]),
                    gapSize: 5,
                    tooltip: {
                        valueDecimals: 2,
                    },
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1,
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors![0]],
                            [
                                1,
                                Highcharts.color(
                                    Highcharts.getOptions().colors![0]
                                )
                                    .setOpacity(0)
                                    .get("rgba"),
                            ],
                        ],
                    },
                    threshold: null,
                },
            ]);
        }
    }, [data, series]);

    const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSymbol(event.target.value);
    };

    const getNewStock = async (event: FormEvent) => {
        event.preventDefault();
        if (!symbol) {
            return;
        }
        resetData();

        const apiKey = import.meta.env.VITE_ALPHAVANTAGE_API_KEY || "";

        if (!apiKey) {
            setFormError("API Key is missing.");
            return;
        }

        try {
            const { data } = await axios.get(
                `https://www.alphavantage.co/query?${new URLSearchParams({
                    function: "TIME_SERIES_DAILY",
                    symbol,
                    outputsize: "full",
                    apikey: apiKey,
                }).toString()}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );
            if (data["Error Message"]) {
                setFormError(data["Error Message"]);
            } else {
                const sortedEntries = Object.entries(
                    data["Time Series (Daily)"] || {}
                ).sort(
                    (a, b) =>
                        new Date(a[0]).getTime() - new Date(b[0]).getTime()
                ) as [string, DataPoint][];
                setData(sortedEntries);
                setGraphTitle(data["Meta Data"]["2. Symbol"]);
            }
        } catch (error) {
            setFormError("Failed to fetch data.");
        }
    };

    const resetData = () => {
        setGraphTitle(null);
        setSampleData(null);
        setFormError(null);
        setInvesting({ start: 1000, end: null });
        setDataEma10(null);
        setDataEma20(null);
        setDataEma50(null);
        setDataSma10(null);
        setDataSma20(null);
        setDataSma50(null);
        setDataSma100(null);
        setDataRsi7(null);
        setDataRsi14(null);
        setDataRsi28(null);
        setDataStochastic7(null);
        setDataStochastic14(null);
        setModelResultTraining(null);
        setModelLogs([]);
        setIsModelTraining(false);
        setSeries([]);
        setData([]);
        modelLogsRef.current = [];
    };

    const splitData = (trainingRange: [number, number]) => {
        const descEma10 = JSON.parse(JSON.stringify(dataEma10)).reverse();
        const descEma20 = JSON.parse(JSON.stringify(dataEma20)).reverse();
        const descEma50 = JSON.parse(JSON.stringify(dataEma50)).reverse();
        const descSma10 = JSON.parse(JSON.stringify(dataSma10)).reverse();
        const descSma20 = JSON.parse(JSON.stringify(dataSma20)).reverse();
        const descSma50 = JSON.parse(JSON.stringify(dataSma50)).reverse();
        const descSma100 = JSON.parse(JSON.stringify(dataSma100)).reverse();
        const descRsi7 = JSON.parse(JSON.stringify(dataRsi7)).reverse();
        const descRsi14 = JSON.parse(JSON.stringify(dataRsi14)).reverse();
        const descRsi28 = JSON.parse(JSON.stringify(dataRsi28)).reverse();
        const descStochastic7 = JSON.parse(
            JSON.stringify(dataStochastic7)
        ).reverse();
        const descStochastic14 = JSON.parse(
            JSON.stringify(dataStochastic14)
        ).reverse();

        const dataRaw = JSON.parse(JSON.stringify(data))
            .reverse()
            .reduce((acc: any[], curr: any, index: number) => {
                if (
                    !descEma10[index] ||
                    !descEma20[index] ||
                    !descEma50[index] ||
                    !descSma10[index] ||
                    !descSma20[index] ||
                    !descSma50[index] ||
                    !descSma100[index] ||
                    !descRsi7[index] ||
                    !descRsi14[index] ||
                    !descRsi28[index] ||
                    !descStochastic7[index] ||
                    !descStochastic14[index]
                ) {
                    return acc;
                }
                return [
                    ...acc,
                    [
                        curr[0],
                        [
                            Number(curr[1]["4. close"]),
                            Number(curr[1]["1. open"]),
                            Number(curr[1]["2. high"]),
                            Number(curr[1]["3. low"]),
                            Number(curr[1]["5. volume"]),
                            descEma10[index],
                            descEma20[index],
                            descEma50[index],
                            descSma10[index],
                            descSma20[index],
                            descSma50[index],
                            descSma100[index],
                            descRsi7[index],
                            descRsi14[index],
                            descRsi28[index],
                            descStochastic7[index],
                            descStochastic14[index],
                        ],
                    ],
                ];
            }, [])
            .reverse();

        const [bottom, top] = trainingRange;
        const baseIndex =
            bottom === 0 ? 0 : Math.ceil(bottom * dataRaw.length) - 1;
        const chunk = dataRaw.slice(
            baseIndex,
            top === 1
                ? undefined
                : baseIndex + 1 + Math.floor((top - bottom) * dataRaw.length)
        );
        return chunk;
    };

    const createTimeseriesDimensionForRNN = (inputs: any[]) => {
        inputs.reverse();
        const chunks = [];
        for (let i = 0; i < inputs.length - 1; i++) {
            chunks.push(inputs.slice(i, i + timeserieSize));
        }

        const newChunks = chunks.map((e) => e.reverse()).reverse();
        const timeseriesChunks: any[] = [];
        newChunks.forEach((chunk) => {
            if (chunk.length === timeserieSize) {
                timeseriesChunks.push(chunk);
            }
        });
        return timeseriesChunks;
    };

    const normalizeData = (dataRaw: number[][], params: any) => {
        const unstackData = (stackData: number[][], axis: number) =>
            stackData.map((e) => e[axis]);
        const dataPerDimension = [];
        for (let i = 0; i < dataRaw[0].length; i++) {
            dataPerDimension.push(unstackData(dataRaw, i));
        }
        let dimensionParams = params;

        if (!params) {
            dimensionParams = dataPerDimension.map((dimension) => {
                const mean =
                    dimension.reduce((acc, curr) => acc + curr, 0) /
                    dimension.length;
                const min = dimension.reduce(
                    (acc: number | null, curr: number) => {
                        if (acc === null || curr < acc) {
                            return curr;
                        }
                        return acc;
                    },
                    null
                );
                const max = dimension.reduce(
                    (acc: number | null, curr: number) => {
                        if (acc === null || curr > acc) {
                            return curr;
                        }
                        return acc;
                    },
                    null
                );
                return {
                    min,
                    max,
                    mean,
                    std: Math.sqrt(
                        dimension
                            .map((e) => (e - mean) ** 2)
                            .reduce((acc, curr) => acc + curr, 0) /
                            dimension.length
                    ),
                };
            });
        }
        const epsilon = 1e-3;
        return {
            dataNormalized: createTimeseriesDimensionForRNN(
                dataRaw.map((set) =>
                    set.map(
                        (e, i) =>
                            (e - dimensionParams[i].mean) /
                            (dimensionParams[i].std + epsilon)
                    )
                )
            ),
            dimensionParams,
        };
    };

    const unNormalizeData = (dataRaw: number[], dimensionParam: any) =>
        dataRaw.map((e) => e * dimensionParam.std + dimensionParam.mean);

    const makeDataset = async (range: [number, number]) => {
        const dataRange: number[][] = splitData(range).map(
            (e: [string, number[]]) => e[1]
        );
        const { dataNormalized, dimensionParams } = normalizeData(
            dataRange,
            null
        );
        const xDataset = tf.data
            .array(dataNormalized)
            .take(dataNormalized.length - 1);
        const yDataset = tf.data
            .array(dataNormalized)
            .map((e) => e[e.length - 1][0])
            .skip(1);
        const xyDataset = tf.data
            .zip({ xs: xDataset, ys: yDataset })
            .batch(batchSize)
            .shuffle(batchSize);
        return { dataset: xyDataset, dimensionParams };
    };

    const createModel = async () => {
        try {
            rebootSeries();
            setIsModelTraining(true);
            setModelResultTraining(null);
            const { dataset: train } = await makeDataset([0, 0.7]);
            const { dataset: validate } = await makeDataset([0.7, 0.9]);

            const model = tf.sequential();

            const cells = [
                tf.layers.lstmCell({ units: 16 }),
                tf.layers.lstmCell({ units: 16 }),
                tf.layers.lstmCell({ units: 16 }),
                tf.layers.lstmCell({ units: 16 }),
            ];

            model.add(
                tf.layers.rnn({
                    cell: cells,
                    inputShape: [timeserieSize, 17],
                    returnSequences: false,
                })
            );

            model.add(
                tf.layers.dense({
                    units: 1,
                })
            );

            model.compile({
                optimizer: "adam",
                loss: "meanSquaredError",
                metrics: ["accuracy"],
            });
            setModelLogs([]);
            modelLogsRef.current = [];
            const history = await model.fitDataset(train, {
                epochs,
                validationData: validate,
                callbacks: {
                    onEpochEnd: (epoch: number, log: tf.Logs | undefined) => {
                        if (log && log.loss !== undefined) {
                            modelLogsRef.current.push([epoch + 1, log.loss]);
                            setModelLogs([...modelLogsRef.current]);
                        }
                    },
                },
            });
            const result = {
                model: model,
                stats: history,
            };

            setModelResultTraining(result);
        } catch (error) {
            throw error;
        } finally {
            setIsModelTraining(false);
        }
    };

    const gessLabels = (
        inputs: number[][][],
        dimensionParams: DimensionParams[]
    ) => {
        const xs = tf.tensor3d(inputs);
        let outputs = modelResultTraining?.model.predict(xs) as tf.Tensor;
        const results = unNormalizeData(
            Array.from(outputs.dataSync()),
            dimensionParams[0]
        );
        return results;
    };

    const makePredictions = async () => {
        setIsPredictionLoading(true);
        await new Promise((r) => setTimeout(r, 300));
        try {
            const newSeries = rebootSeries();
            const xs = splitData([0.9, 1]);
            const timeseriesChunks = createTimeseriesDimensionForRNN(xs);
            const predictions: [number, number][] = [];
            const flagsSerie: {
                x: number;
                title: string;
                text: string;
                color: string;
            }[] = [];
            let _money: number = investing.start;
            let _flag: FlagType = {};
            let _value: number | undefined;
            let _lastValue: number | undefined;
            let _ys: number | undefined;
            timeseriesChunks.forEach(
                (chunk: [string, number[]][], index, array) => {
                    const { dataNormalized, dimensionParams } = normalizeData(
                        chunk.map((e: [string, number[]]) => e[1]),
                        null
                    );
                    const value = chunk[chunk.length - 1][1][0];
                    _lastValue = value;
                    const date = chunk[chunk.length - 1][0];
                    const [ys] = gessLabels(dataNormalized, dimensionParams);
                    if (_ys !== undefined) {
                        const predEvol = (ys - _ys) / _ys;
                        const flag: FlagType = {};
                        if (
                            (strategy == 1
                                ? predEvol > 0 && ys > value
                                : true) &&
                            (strategy == 2 ? predEvol > 0 : true) &&
                            (strategy == 3 ? ys > value : true)
                        ) {
                            flag.type = "buy";
                        }
                        if (
                            (strategy == 1
                                ? predEvol < 0 && ys < value
                                : true) &&
                            (strategy == 2 ? predEvol < 0 : true) &&
                            (strategy == 3 ? ys < value : true)
                        ) {
                            flag.type = "sell";
                        }
                        if (_flag.type !== flag.type && flag.type) {
                            if (!_value) {
                                _value = value;
                            }
                            let realEvolv2 = (value - _value) / _value;

                            if (_flag.type === "buy") {
                                _money = _money * (1 + realEvolv2);
                            }
                            if (_flag.type === "sell") {
                                _money = _money * (1 + -1 * realEvolv2);
                            }
                            _value = value;
                            flag.label = `Investindo $${Math.round(
                                _money
                            )}$ ao valor de ${value}`;
                            flagsSerie.push({
                                x: new Date(date).getTime(),
                                title: flag.type,
                                text: flag.label,
                                color: flag.type === "buy" ? "green" : "red",
                            });
                            _flag = flag;
                        }
                    }

                    let datePredicted;
                    const nextChunk = array[index + 1];
                    if (nextChunk) {
                        const nextDate = nextChunk[nextChunk.length - 1][0];
                        datePredicted = new Date(nextDate).getTime();
                    } else {
                        const lastDate = chunk[chunk.length - 1][0];
                        datePredicted = new Date(lastDate).setDate(
                            new Date(lastDate).getDate() + 1
                        );
                    }

                    predictions.push([datePredicted, ys]);
                    _ys = ys;
                }
            );
            (function finishOffTheLastTrade() {
                if (_lastValue !== undefined && _value !== undefined) {
                    let realEvolv2 = (_lastValue - _value) / _value;

                    if (_flag.type === "buy") {
                        _money = _money * (1 + realEvolv2);
                    }
                    if (_flag.type === "sell") {
                        _money = _money * (1 + -1 * realEvolv2);
                    }
                }
            })();
            setInvesting({ start: 1000, end: _money });
            setSeries([
                ...newSeries,
                {
                    type: "line",
                    name: "Predicted value",
                    data: predictions,
                },
                {
                    type: "flags",
                    data: flagsSerie,
                    onSeries: "dataseries",
                    shape: "circlepin",
                    width: 18,
                },
            ]);
        } catch (error) {
            throw error;
        } finally {
            setIsPredictionLoading(false);
        }
    };

    const rebootSeries = () => {
        setInvesting({ start: 1000, end: null });
        const serieIndex = series.findIndex(
            (serie) => serie.name === "Predicted value"
        );
        let newSeries = series;
        if (serieIndex !== -1) {
            newSeries.splice(serieIndex, 2);
            setSeries([...newSeries]);
        }
        return newSeries;
    };

    const options = {
        rangeSelector: {
            selected: 4,
        },

        title: {
            text: `${graphTitle} stock market`,
        },

        tooltip: {
            style: {
                width: "200px",
            },
            valueDecimals: 4,
            shared: true,
        },

        yAxis: {
            title: {
                text: "Valor da Ação",
            },
        },
        xAxis: {
            type: "datetime",
        },
        series,
    };

    const options2 = {
        title: {
            text: "Gráfico de Treinamento do Modelo",
        },

        subtitle: {
            text: "Erro do Modelo Tensorflow.js Durante o Treinamento",
        },

        yAxis: {
            title: {
                text: "Erro",
            },
        },

        xAxis: {
            title: {
                text: "Epoch",
            },
            min: 1,
            max: epochs,
        },

        series: [
            {
                type: "line",
                name: "loss",
                data: modelLogs,
            },
        ],

        responsive: {
            rules: [
                {
                    condition: {
                        maxWidth: 500,
                    },
                },
            ],
        },
    };
    return (
        <div>
            <h1>Projeto Machine Learning com JavaScript</h1>
            <h2>
                Web App Para Previsão do Preço de Ações com Machine Learning e
                Tensorflow.js
            </h2>
            <h3>
                Modelo de IA com Arquitetura Recorrente LSTM (LSTM Long-Short
                Term Memory)
            </h3>
            <h4>
                Treinamento do Modelo e Previsões são feitos no navegador via
                Tensorflow.js
            </h4>

            <form onSubmit={getNewStock}>
                <label>
                    <span>Symbol : </span>
                    <input
                        type="text"
                        name="symbol"
                        placeholder="AAPL"
                        onChange={handleSymbolChange}
                        value={symbol}
                    ></input>
                </label>
                <button type="submit">Obter Dados de Outra Empresa</button>
            </form>
            {formError && <p>{formError}</p>}
            {series.length > 0 && (
                <>
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                        constructorType={"stockChart"}
                    />

                    <div style={{ margin: "10px 5px" }}>
                        <label>
                            <span>
                                Defina quantos períodos são necessários para a
                                rede neural detectar padrões recorrentes:
                            </span>
                            <input
                                size={2}
                                value={recurrence}
                                disabled={
                                    isModelTraining || isPredictionLoading
                                }
                                onChange={(event) => {
                                    const value = Number(event.target.value);
                                    if (!isNaN(value)) {
                                        setRecurrence(value);
                                    }
                                }}
                            />
                            {typeof recurrence !== "number" && (
                                <span>Use somente números</span>
                            )}
                            {typeof recurrence === "number" &&
                                recurrence < 2 && (
                                    <span>
                                        Mínimo de 2 recorrências para normalizar
                                        entradas com média e desvio padrão
                                    </span>
                                )}
                            {typeof recurrence === "number" &&
                                recurrence > 32 && (
                                    <span>
                                        Isso pode demorar um pouco. Seja
                                        paciente...
                                    </span>
                                )}
                        </label>
                        <br />
                        <br />
                        <button
                            onClick={createModel}
                            type="button"
                            disabled={isModelTraining || isPredictionLoading}
                            style={{ fontSize: 16, marginRight: 5 }}
                        >
                            {isModelTraining
                                ? "O Modelo Está Sendo Treinado! Aguarde!"
                                : "Treinar e Validar o Modelo"}
                        </button>
                        <br />
                        <br />
                        <span>
                            Defina a estratégia de previsão (você pode alterá-la
                            a qualquer momento, mesmo quando o modelo tensorflow
                            já estiver compilado, basta clicar em Faça Previsões
                            novamente) :
                        </span>
                        <br />
                        <br />
                        <input
                            disabled={
                                isModelTraining ||
                                !modelResultTraining ||
                                isPredictionLoading
                            }
                            checked={strategy == 2}
                            type="radio"
                            id="Default"
                            name="flag-strategy"
                            value={2}
                            onChange={(event) => {
                                setStrategy(Number(event.target.value));
                            }}
                        />
                        <label htmlFor="Default">
                            Estratégia Padrão - A previsão no dia seguinte é
                            maior que a previsão hoje (o inverso da ordem de
                            venda)
                        </label>
                        <br />
                        <br />
                        <input
                            disabled={
                                isModelTraining ||
                                !modelResultTraining ||
                                isPredictionLoading ||
                                true
                            }
                            checked={strategy == 3}
                            type="radio"
                            id="classic"
                            name="flag-strategy"
                            value={3}
                            onChange={(event) => {
                                setStrategy(Number(event.target.value));
                            }}
                        />
                        <label htmlFor="classic">
                            Estratégia Clássica - A previsão do dia seguinte é
                            maior que o valor real hoje (o inverso da ordem de
                            venda)
                        </label>
                        <br />
                        <br />
                        <input
                            disabled={
                                isModelTraining ||
                                !modelResultTraining ||
                                isPredictionLoading ||
                                true
                            }
                            checked={strategy == 1}
                            type="radio"
                            id="secure"
                            name="flag-strategy"
                            value={1}
                            onChange={(event) => {
                                setStrategy(Number(event.target.value));
                            }}
                        />
                        <label htmlFor="secure">
                            Estratégia Segura - A previsão no dia seguinte é
                            maior do que a previsão hoje e a previsão do dia
                            seguinte é maior que o valor real hoje (o inverso da
                            ordem de venda)
                        </label>
                        <br />
                        <br />
                        <button
                            onClick={makePredictions}
                            type="button"
                            disabled={
                                !modelResultTraining || isPredictionLoading
                            }
                            style={{ fontSize: 16, marginRight: 5 }}
                        >
                            Fazer Previsões
                        </button>
                        <br />
                        {isModelTraining && (
                            <p>
                                <u>
                                    Por favor, mantenha o navegador aberto e
                                    deixe seu computador fazer o trabalho!
                                </u>
                            </p>
                        )}
                        {isPredictionLoading && (
                            <p>
                                <u>
                                    Por favor, mantenha o navegador aberto, as
                                    previsões estão carregando!
                                </u>
                            </p>
                        )}
                        {modelLogs.length > 0 && (
                            <>
                                {investing.end ? (
                                    <p>{`Você investiu $${
                                        investing.start
                                    } e receberá como retorno um total de $${Math.round(
                                        investing.end
                                    )}`}</p>
                                ) : (
                                    <p>{`Você está investindo $${investing.start}. Aguarde o término do treinamento do modelo e clique em Fazer Previsões!`}</p>
                                )}

                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={options2}
                                    constructorType={"chart"}
                                />
                            </>
                        )}
                        <p>
                            Os indicadores financeiros utilizados são os
                            seguintes:
                        </p>
                        <ul>
                            <li>Close value</li>
                            <li>Open value</li>
                            <li>Daily high value</li>
                            <li>Daily low value</li>
                            <li>Daily volume</li>
                            <li>
                                EMA10 (Exponential Moving Average 10 periods)
                            </li>
                            <li>
                                EMA20 (Exponential Moving Average 20 periods)
                            </li>
                            <li>
                                EMA50 (Exponential Moving Average 50 periods)
                            </li>
                            <li>SMA10 (Simple Moving Average 10 periods)</li>
                            <li>SMA20 (Simple Moving Average 20 periods)</li>
                            <li>SMA50 (Simple Moving Average 50 periods)</li>
                            <li>SMA100 (Simple Moving Average 100 periods)</li>
                            <li>RSI7 (Relative Strength Index 7 periods)</li>
                            <li>RSI14 (Relative Strength Index 14 periods)</li>
                            <li>RSI28 (Relative Strength Index 28 periods)</li>
                            <li>Stochastic7 (last 7 periods)</li>
                            <li>Stochastic14 (last 14 periods)</li>
                        </ul>
                        <p>
                            {`Usamos períodos (80%, 10%, 10%) divididos por lote de ${batchSize} para treinamento, validação,
               e conjunto de teste.`}
                        </p>
                        <ul>
                            <li>
                                Para treinamento e validação do modelo usamos
                                dados de treinamento e validação com proporção
                                80% e 10% respectivamente.
                            </li>
                            <li>
                                {`Para o botão Fazer Previsões usamos o conjunto de teste (10%). Para cada dia (todo dia) nós
                prevemos o valor do dia seguinte com a última sequência de ${timeserieSize} períodos (pode ser necessário fazer zoom o gráfico).`}
                            </li>
                        </ul>
                        {sampleData && (
                            <>
                                <br />
                                <p>Resumo estatístico dos dados:</p>
                                <table border={1}>
                                    <thead>
                                        <tr>
                                            <th>min</th>
                                            <th>max</th>
                                            <th>mean</th>
                                            <th>std</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(
                                            sampleData.sampleDimensionParams as Record<
                                                string,
                                                {
                                                    min: number;
                                                    max: number;
                                                    mean: number;
                                                    std: number;
                                                }
                                            >
                                        ).map((e1, i1) => (
                                            <tr
                                                key={`sampleDimensionParams-row-${i1}`}
                                            >
                                                {Object.values(e1[1]).map(
                                                    (e2, i2) => (
                                                        <td
                                                            key={`sampleDimensionParams-column-${i2}`}
                                                        >
                                                            {e2}
                                                        </td>
                                                    )
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p>
                                    Amostra dos dados brutos com os indicadores
                                    financeiros utilizados:
                                </p>
                                <table border={1}>
                                    <thead>
                                        <tr>
                                            <th>Close value</th>
                                            <th>Open value</th>
                                            <th>High</th>
                                            <th>Low</th>
                                            <th>Volume</th>
                                            <th>EMA10</th>
                                            <th>EMA20</th>
                                            <th>EMA50</th>
                                            <th>SMA10</th>
                                            <th>SMA20</th>
                                            <th>SMA50</th>
                                            <th>SMA100</th>
                                            <th>RSI7</th>
                                            <th>RSI14</th>
                                            <th>RSI28</th>
                                            <th>Stochastic7</th>
                                            <th>Stochastic14</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sampleData.sampleDataRaw.map(
                                            (e1: number[], i1: number) => (
                                                <tr
                                                    key={`sampleDataRaw-row-${i1}`}
                                                >
                                                    {e1.map((e2, i2) => (
                                                        <td
                                                            key={`sampleDataRaw-column-${i2}`}
                                                        >
                                                            {e2}
                                                        </td>
                                                    ))}
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Main;
