// ModelControls.tsx
import React from "react";

interface ModelControlsProps {
    recurrence: number;
    isModelTraining: boolean;
    isPredictionLoading: boolean;
    strategy: number;
    modelResultTraining: any;
    setRecurrence: (value: number) => void;
    setStrategy: (value: number) => void;
    createModel: () => void;
    makePredictions: () => void;
}

const ModelControls: React.FC<ModelControlsProps> = ({
    recurrence,
    isModelTraining,
    isPredictionLoading,
    strategy,
    modelResultTraining,
    setRecurrence,
    setStrategy,
    createModel,
    makePredictions,
}) => {
    return (
        <div style={{ margin: "10px 5px" }}>
            <label>
                <span>
                    Defina quantos períodos são necessários para a rede neural
                    detectar padrões recorrentes:
                </span>
                <input
                    size={2}
                    value={recurrence}
                    disabled={isModelTraining || isPredictionLoading}
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
                {typeof recurrence === "number" && recurrence < 2 && (
                    <span>
                        Mínimo de 2 recorrências para normalizar entradas com
                        média e desvio padrão
                    </span>
                )}
                {typeof recurrence === "number" && recurrence > 32 && (
                    <span>Isso pode demorar um pouco. Seja paciente...</span>
                )}
            </label>
            <br />
            <br />
            <button
                className="bg-primary hover:bg-secondary hover:text-white-50 px-4 py-2 rounded-lg"
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
                Defina a estratégia de previsão (você pode alterá-la a qualquer
                momento, mesmo quando o modelo tensorflow já estiver compilado,
                basta clicar em Faça Previsões novamente):
            </span>
            <br />
            <br />
            <input
                disabled={
                    isModelTraining ||
                    !modelResultTraining ||
                    isPredictionLoading
                }
                checked={strategy === 2}
                type="radio"
                id="Default"
                name="flag-strategy"
                value={2}
                onChange={(event) => setStrategy(Number(event.target.value))}
            />
            <label htmlFor="Default">
                Estratégia Padrão - A previsão no dia seguinte é maior que a
                previsão hoje (o inverso da ordem de venda)
            </label>
            <br />
            <br />
            <input
                disabled={
                    isModelTraining ||
                    !modelResultTraining ||
                    isPredictionLoading
                }
                checked={strategy === 3}
                type="radio"
                id="classic"
                name="flag-strategy"
                value={3}
                onChange={(event) => setStrategy(Number(event.target.value))}
            />
            <label htmlFor="classic">
                Estratégia Clássica - A previsão do dia seguinte é maior que o
                valor real hoje (o inverso da ordem de venda)
            </label>
            <br />
            <br />
            <input
                disabled={
                    isModelTraining ||
                    !modelResultTraining ||
                    isPredictionLoading
                }
                checked={strategy === 1}
                type="radio"
                id="secure"
                name="flag-strategy"
                value={1}
                onChange={(event) => setStrategy(Number(event.target.value))}
            />
            <label htmlFor="secure">
                Estratégia Segura - A previsão no dia seguinte é maior do que a
                previsão hoje e a previsão do dia seguinte é maior que o valor
                real hoje (o inverso da ordem de venda)
            </label>
            <br />
            <br />
            <button
                onClick={makePredictions}
                type="button"
                disabled={!modelResultTraining || isPredictionLoading}
                style={{ fontSize: 16, marginRight: 5 }}
            >
                Fazer Previsões
            </button>
            <br />
            {isModelTraining && (
                <p>
                    <u>
                        Por favor, mantenha o navegador aberto e deixe seu
                        computador fazer o trabalho!
                    </u>
                </p>
            )}
            {isPredictionLoading && (
                <p>
                    <u>
                        Por favor, mantenha o navegador aberto, as previsões
                        estão carregando!
                    </u>
                </p>
            )}
        </div>
    );
};

export default ModelControls;
