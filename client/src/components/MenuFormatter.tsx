import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MealItem {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  instructions?: string[];
  ingredients?: Array<{ name: string; quantity: string }>;
}

interface MealSection {
  mealTime: string;
  emoji: string;
  items: MealItem[];
  totalCalories?: number;
}

interface MenuFormatterProps {
  meals: MealSection[];
  totalDayCalories?: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const MenuFormatter: React.FC<MenuFormatterProps> = ({
  meals,
  totalDayCalories,
  macros,
}) => {
  return (
    <div className="space-y-6 p-4">
      {/* Resumen del día */}
      {(totalDayCalories || macros) && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 border-orange-200">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            📊 Resumen Nutricional del Día
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {totalDayCalories && (
              <div className="bg-card rounded-lg p-4 text-center border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">
                  {totalDayCalories}
                </div>
                <div className="text-sm text-muted-foreground">kcal Totales</div>
              </div>
            )}
            {macros && (
              <>
                <div className="bg-card rounded-lg p-4 text-center border border-orange-200">
                  <div className="text-3xl font-bold text-blue-600">
                    {macros.protein}g
                  </div>
                  <div className="text-sm text-muted-foreground">Proteínas</div>
                </div>
                <div className="bg-card rounded-lg p-4 text-center border border-orange-200">
                  <div className="text-3xl font-bold text-yellow-600">
                    {macros.carbs}g
                  </div>
                  <div className="text-sm text-muted-foreground">Carbohidratos</div>
                </div>
                <div className="bg-card rounded-lg p-4 text-center border border-orange-200">
                  <div className="text-3xl font-bold text-red-600">
                    {macros.fat}g
                  </div>
                  <div className="text-sm text-muted-foreground">Grasas</div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Comidas por momento del día */}
      {meals.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">{section.emoji}</span>
            <h3 className="text-xl font-bold text-foreground">
              {section.mealTime}
            </h3>
            {section.totalCalories && (
              <Badge className="ml-auto bg-orange-100 text-orange-800">
                {section.totalCalories} kcal
              </Badge>
            )}
          </div>

          <div className="space-y-3 ml-8">
            {section.items.map((item, itemIdx) => (
              <Card
                key={itemIdx}
                className="p-4 border-l-4 border-l-orange-400 bg-card hover:shadow-md transition-shadow"
              >
                {/* Nombre de la receta */}
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {item.name}
                </h4>

                {/* Información nutricional */}
                {(item.calories || item.protein || item.carbs || item.fat) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                    {item.calories && (
                      <div className="bg-orange-50 rounded p-2">
                        <div className="font-semibold text-orange-700">
                          {item.calories}
                        </div>
                        <div className="text-muted-foreground text-xs">kcal</div>
                      </div>
                    )}
                    {item.protein && (
                      <div className="bg-blue-50 rounded p-2">
                        <div className="font-semibold text-blue-700">
                          {item.protein}g
                        </div>
                        <div className="text-muted-foreground text-xs">Proteína</div>
                      </div>
                    )}
                    {item.carbs && (
                      <div className="bg-yellow-50 rounded p-2">
                        <div className="font-semibold text-yellow-700">
                          {item.carbs}g
                        </div>
                        <div className="text-muted-foreground text-xs">Carbos</div>
                      </div>
                    )}
                    {item.fat && (
                      <div className="bg-red-50 rounded p-2">
                        <div className="font-semibold text-red-700">
                          {item.fat}g
                        </div>
                        <div className="text-muted-foreground text-xs">Grasas</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ingredientes */}
                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-semibold text-foreground/80 text-sm mb-2">
                      🥘 Ingredientes:
                    </h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {item.ingredients.map((ing, ingIdx) => (
                        <li key={ingIdx} className="flex items-start gap-2">
                          <span className="text-orange-400 mt-1">•</span>
                          <span>
                            {ing.quantity} {ing.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instrucciones */}
                {item.instructions && item.instructions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-foreground/80 text-sm mb-2">
                      👨‍🍳 Preparación:
                    </h5>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      {item.instructions.map((instruction, instrIdx) => (
                        <li key={instrIdx} className="flex gap-3">
                          <span className="font-semibold text-orange-600 flex-shrink-0">
                            {instrIdx + 1}.
                          </span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Footer con recomendación */}
      <Card className="bg-blue-50 border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Consejo:</strong> Este menú es una sugerencia. Siempre
          consulta con un profesional de la salud o nutricionista para
          personalizarlo según tus necesidades específicas.
        </p>
      </Card>
    </div>
  );
};
