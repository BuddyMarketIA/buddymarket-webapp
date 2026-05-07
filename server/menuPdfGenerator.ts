import { PDFDocument, PDFPage, rgb, PDFFont } from "pdf-lib";
import { SpecialMenu, EventMenu } from "../drizzle/schema";

interface MenuForPDF {
  name: string;
  description?: string | null;
  type: "special" | "event";
  menuType?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  eventDate?: string;
  persons?: number | null;
  guestCount?: number;
  difficulty?: string;
  dailyCalories?: number | null;
  budget?: string;
  cuisineType?: string;
  notes?: string | null;
  menuJson?: string | null;
}

export async function generateMenuPDF(menu: MenuForPDF): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size
  
  const { width, height } = page.getSize();
  const margin = 40;
  const contentWidth = width - margin * 2;
  let yPosition = height - margin;

  // Helper functions
  const drawText = (text: string, size: number, bold: boolean = false, color = rgb(0, 0, 0)) => {
    const fontSize = size;
    const lines = text.split("\n");
    lines.forEach((line) => {
      if (yPosition < margin + 20) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - margin;
      }
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        color,
        font: bold ? pdfDoc.getFont("Helvetica-Bold") : pdfDoc.getFont("Helvetica"),
        maxWidth: contentWidth,
      });
      yPosition -= fontSize + 4;
    });
  };

  const drawLine = (color = rgb(200, 200, 200)) => {
    if (yPosition < margin + 20) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - margin;
    }
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      color,
      thickness: 1,
    });
    yPosition -= 15;
  };

  // Header
  drawText("BuddyOne", 24, true, rgb(249, 115, 22)); // Orange color
  yPosition -= 5;
  drawText("Menú Personalizado", 14, false, rgb(100, 100, 100));
  yPosition -= 15;
  drawLine();

  // Title
  drawText(menu.name, 20, true);
  yPosition -= 10;

  // Type badge
  const typeLabel = menu.type === "special" 
    ? `Menú Especial - ${menu.menuType || "Dieta"}` 
    : `Evento - ${menu.eventType || "Otro"}`;
  drawText(typeLabel, 11, false, rgb(249, 115, 22));
  yPosition -= 15;

  // Description
  if (menu.description) {
    drawText("Descripción", 12, true);
    drawText(menu.description, 10);
    yPosition -= 10;
  }

  // Key Information
  drawText("Información del Menú", 12, true);
  yPosition -= 5;

  const infoLines: string[] = [];
  
  if (menu.type === "special") {
    if (menu.startDate) infoLines.push(`Fecha de inicio: ${new Date(menu.startDate).toLocaleDateString("es-ES")}`);
    if (menu.endDate) infoLines.push(`Fecha de fin: ${new Date(menu.endDate).toLocaleDateString("es-ES")}`);
  } else {
    if (menu.eventDate) infoLines.push(`Fecha del evento: ${new Date(menu.eventDate).toLocaleDateString("es-ES")}`);
    if (menu.guestCount) infoLines.push(`Número de invitados: ${menu.guestCount}`);
    if (menu.cuisineType) infoLines.push(`Tipo de cocina: ${menu.cuisineType}`);
    if (menu.budget) infoLines.push(`Presupuesto: €${menu.budget}`);
  }

  if (menu.persons) infoLines.push(`Personas: ${menu.persons}`);
  if (menu.difficulty) {
    const difficultyLabel = menu.difficulty === "easy" ? "Fácil" : menu.difficulty === "medium" ? "Medio" : "Difícil";
    infoLines.push(`Dificultad: ${difficultyLabel}`);
  }
  if (menu.dailyCalories) infoLines.push(`Calorías diarias: ${menu.dailyCalories} kcal`);

  infoLines.forEach((line) => {
    drawText(line, 10);
  });
  yPosition -= 10;

  // Menu Content
  if (menu.menuJson) {
    try {
      const menuData = JSON.parse(menu.menuJson);
      
      drawLine();
      drawText("Contenido del Menú", 12, true);
      yPosition -= 5;

      if (menuData.days && Array.isArray(menuData.days)) {
        menuData.days.forEach((day: any) => {
          drawText(day.day || "Día", 11, true);
          yPosition -= 3;

          if (day.meals && Array.isArray(day.meals)) {
            day.meals.forEach((meal: any) => {
              const mealText = `${meal.time || ""} - ${meal.food || ""} (${meal.grams || 0}g)`;
              drawText(mealText, 9);
            });
          }
          yPosition -= 8;
        });
      } else if (menuData.recipes && Array.isArray(menuData.recipes)) {
        menuData.recipes.forEach((recipe: any) => {
          drawText(recipe.name || "Receta", 11, true);
          if (recipe.ingredients) {
            drawText("Ingredientes:", 9, true);
            recipe.ingredients.forEach((ing: any) => {
              const ingText = typeof ing === "string" ? ing : `${ing.name} - ${ing.quantity}`;
              drawText(`• ${ingText}`, 9);
            });
          }
          yPosition -= 5;
        });
      }
    } catch (e) {
      // Si no es JSON válido, mostrar como texto
      drawText(menu.menuJson, 10);
    }
  }

  // Notes
  if (menu.notes) {
    yPosition -= 10;
    drawLine();
    drawText("Notas", 12, true);
    yPosition -= 5;
    drawText(menu.notes, 10);
  }

  // Footer
  yPosition = margin + 20;
  drawLine();
  drawText(`Generado con BuddyOne - ${new Date().toLocaleDateString("es-ES")}`, 8, false, rgb(150, 150, 150));

  return Buffer.from(await pdfDoc.save());
}

export async function generateMenusPDF(menus: MenuForPDF[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  for (let i = 0; i < menus.length; i++) {
    const menu = menus[i];
    let page = pdfDoc.addPage([595, 842]); // A4 size
    
    const { width, height } = page.getSize();
    const margin = 40;
    const contentWidth = width - margin * 2;
    let yPosition = height - margin;

    // Helper functions
    const drawText = (text: string, size: number, bold: boolean = false, color = rgb(0, 0, 0)) => {
      const fontSize = size;
      const lines = text.split("\n");
      lines.forEach((line) => {
        if (yPosition < margin + 20) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = height - margin;
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color,
          font: bold ? pdfDoc.getFont("Helvetica-Bold") : pdfDoc.getFont("Helvetica"),
          maxWidth: contentWidth,
        });
        yPosition -= fontSize + 4;
      });
    };

    const drawLine = (color = rgb(200, 200, 200)) => {
      if (yPosition < margin + 20) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - margin;
      }
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        color,
        thickness: 1,
      });
      yPosition -= 15;
    };

    // Header
    drawText("BuddyOne", 24, true, rgb(249, 115, 22));
    yPosition -= 5;
    drawText("Menú Personalizado", 14, false, rgb(100, 100, 100));
    yPosition -= 15;
    drawLine();

    // Title
    drawText(menu.name, 20, true);
    yPosition -= 10;

    // Type badge
    const typeLabel = menu.type === "special" 
      ? `Menú Especial - ${menu.menuType || "Dieta"}` 
      : `Evento - ${menu.eventType || "Otro"}`;
    drawText(typeLabel, 11, false, rgb(249, 115, 22));
    yPosition -= 15;

    // Description
    if (menu.description) {
      drawText("Descripción", 12, true);
      drawText(menu.description, 10);
      yPosition -= 10;
    }

    // Key Information
    drawText("Información del Menú", 12, true);
    yPosition -= 5;

    const infoLines: string[] = [];
    
    if (menu.type === "special") {
      if (menu.startDate) infoLines.push(`Fecha de inicio: ${new Date(menu.startDate).toLocaleDateString("es-ES")}`);
      if (menu.endDate) infoLines.push(`Fecha de fin: ${new Date(menu.endDate).toLocaleDateString("es-ES")}`);
    } else {
      if (menu.eventDate) infoLines.push(`Fecha del evento: ${new Date(menu.eventDate).toLocaleDateString("es-ES")}`);
      if (menu.guestCount) infoLines.push(`Número de invitados: ${menu.guestCount}`);
      if (menu.cuisineType) infoLines.push(`Tipo de cocina: ${menu.cuisineType}`);
      if (menu.budget) infoLines.push(`Presupuesto: €${menu.budget}`);
    }

    if (menu.persons) infoLines.push(`Personas: ${menu.persons}`);
    if (menu.difficulty) {
      const difficultyLabel = menu.difficulty === "easy" ? "Fácil" : menu.difficulty === "medium" ? "Medio" : "Difícil";
      infoLines.push(`Dificultad: ${difficultyLabel}`);
    }
    if (menu.dailyCalories) infoLines.push(`Calorías diarias: ${menu.dailyCalories} kcal`);

    infoLines.forEach((line) => {
      drawText(line, 10);
    });
    yPosition -= 10;

    // Menu Content
    if (menu.menuJson) {
      try {
        const menuData = JSON.parse(menu.menuJson);
        
        drawLine();
        drawText("Contenido del Menú", 12, true);
        yPosition -= 5;

        if (menuData.days && Array.isArray(menuData.days)) {
          menuData.days.forEach((day: any) => {
            drawText(day.day || "Día", 11, true);
            yPosition -= 3;

            if (day.meals && Array.isArray(day.meals)) {
              day.meals.forEach((meal: any) => {
                const mealText = `${meal.time || ""} - ${meal.food || ""} (${meal.grams || 0}g)`;
                drawText(mealText, 9);
              });
            }
            yPosition -= 8;
          });
        }
      } catch (e) {
        // Si no es JSON válido, mostrar como texto
        drawText(menu.menuJson, 10);
      }
    }

    // Notes
    if (menu.notes) {
      yPosition -= 10;
      drawLine();
      drawText("Notas", 12, true);
      yPosition -= 5;
      drawText(menu.notes, 10);
    }

    // Footer
    yPosition = margin + 20;
    drawLine();
    drawText(`Generado con BuddyOne - ${new Date().toLocaleDateString("es-ES")}`, 8, false, rgb(150, 150, 150));

    // Add page break if not the last menu
    if (i < menus.length - 1) {
      page.drawText("", { x: 0, y: 0 }); // Placeholder for page break
    }
  }

  return Buffer.from(await pdfDoc.save());
}
