import React, { FormEvent } from "react";

interface SymbolFormProps {
  symbol: string;
  formError: string | null;
  onSymbolChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent) => void;
}

const SymbolForm: React.FC<SymbolFormProps> = ({
  symbol,
  formError,
  onSymbolChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <label>
        <span>Symbol : </span>
        <input
          type="text"
          name="symbol"
          placeholder="AAPL"
          onChange={onSymbolChange}
          value={symbol}
        ></input>
      </label>
      <button type="submit">Obter Dados de Outra Empresa</button>
      {formError && <p>{formError}</p>}
    </form>
  );
};

export default SymbolForm;
