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
            <button
                type="submit"
                className="ml-4 bg-secondary-dark text-white px-4 py-2 rounded hover:scale-105"
            >
                Obter Dados de Outra Empresa
            </button>
            {formError && <p>{formError}</p>}
        </form>
    );
};

export default SymbolForm;
