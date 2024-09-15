import React from "react";

interface TrainingFeedbackProps {
  currentEpoch: number;
  totalEpochs: number;
  currentLoss: number | null;
  error: string | null;
  isTraining: boolean;
}

const TrainingFeedback: React.FC<TrainingFeedbackProps> = ({
  currentEpoch,
  totalEpochs,
  currentLoss,
  error,
  isTraining,
}) => {
  if (!isTraining) return null; 

  return (
    <div className="training-feedback">
      <h3>Treinamento em Progresso</h3>
      {error ? (
        <div className="error-message">
          <p>Erro durante o treinamento: {error}</p>
        </div>
      ) : (
        <>
          <p>Época: {currentEpoch} de {totalEpochs}</p>
          <p>Perda atual: {currentLoss?.toFixed(6)}</p>
          <progress value={currentEpoch} max={totalEpochs}></progress>
        </>
      )}
    </div>
  );
};

export default TrainingFeedback;
