import React, { createContext, useContext } from "react";

interface ExpertModeContextType {
  expertMode: boolean;
  toggleExpertMode: () => void;
}

export const ExpertModeContext = createContext<ExpertModeContextType>({
  expertMode: false,
  toggleExpertMode: () => {},
});

export function useExpertMode() {
  return useContext(ExpertModeContext);
}
