export const questions = [
  // --- PREGAME ---
  {
    id: 1,
    question: "¿Quién gana el volado?",
    options: ["Seahawks", "Patriots"],
    category: "pregame",
    explanation: "Antes del partido, el árbitro lanza una moneda al aire. El equipo que gana elige si quiere recibir el balón primero o patear. Apuesta a qué equipo gana esa elección."
  },
  {
    id: 2,
    question: "¿Qué cara cae en la moneda?",
    options: ["Cara (Heads)", "Cruz (Tails)"],
    category: "pregame",
    explanation: "Pura suerte. El Super Bowl usa una moneda conmemorativa especial. ¿De qué lado caerá?"
  },
  {
    id: 3,
    question: "Duración del Himno Nacional",
    options: ["Más de 119.5 seg", "Menos de 119.5 seg"],
    category: "pregame",
    explanation: "Charlie Puth cantará el himno de EE.UU. Se cronometra desde la primera palabra hasta la última nota de '...and the home of the brave'. Si dura exactamente 2 minutos, cuenta como 'Más'."
  },

  // --- GAME ACTION ---
  {
    id: 4,
    question: "Primer Touchdown: ¿Cómo se anota?",
    options: ["Por Pase", "Por Carrera", "Defensa/Equipos Especiales"],
    category: "game",
    explanation: "Un Touchdown (6 pts) es cuando el balón cruza la zona de anotación. PASE: el QB lanza y un receptor atrapa en la zona. CARRERA: un jugador corre hasta la zona con el balón. DEFENSA: roban el balón y lo regresan para anotar."
  },
  {
    id: 5,
    question: "¿El balón pega en los postes? (Doink)",
    options: ["Sí, ¡Doink!", "No"],
    category: "game",
    explanation: "Cuando patean un Gol de Campo (3 pts) o Punto Extra (1 pt), a veces el balón pega en los postes amarillos haciendo un sonido metálico ('doink'). Puede entrar o no después del golpe."
  },
  {
    id: 6,
    question: "¿Habrá un Safety en el partido?",
    options: ["Sí", "No"],
    category: "game",
    explanation: "Un Safety (2 pts) es una jugada rara. Ocurre cuando tackean a un jugador ofensivo DENTRO de su propia zona de anotación, o si el balón sale por esa zona. Es muy poco común pero emocionante."
  },
  {
    id: 7,
    question: "¿Qué pasa primero: Pase Incompleto o Intercepción?",
    options: ["Pase Incompleto", "Intercepción"],
    category: "game",
    explanation: "Cuando un pase falla puede ser: INCOMPLETO (el balón cae al suelo) o INTERCEPCIÓN (un defensor lo atrapa y se lo roba). ¿Cuál sucederá primero en el partido?"
  },
  {
    id: 8,
    question: "Distancia del 1er Gol de Campo",
    options: ["Más de 38.5 yardas", "Menos de 38.5 yardas"],
    category: "game",
    explanation: "Un Gol de Campo es cuando patean el balón entre los postes amarillos (3 pts). Se mide la distancia desde donde patearon. 38.5 yardas es distancia media - ni muy cerca ni muy lejos del arco."
  },
  {
    id: 9,
    question: "¿Última jugada será rodilla al piso?",
    options: ["Sí (Victory Formation)", "No"],
    category: "game",
    explanation: "Si un equipo va ganando al final, en vez de arriesgar, el QB simplemente se arrodilla para que se acabe el tiempo. Se llama 'Victory Formation' o 'Formación Victoria'. Es la forma más segura de cerrar un partido."
  },

  // --- HALFTIME (Bad Bunny) ---
  {
    id: 10,
    question: "1ra Canción de Bad Bunny",
    options: ["Tití Me Preguntó", "Mónaco", "Baile Inolvidable", "Otra canción"],
    category: "halftime",
    explanation: "El show de medio tiempo dura ~13 minutos. ¿Con qué canción abrirá Bad Bunny? Los intros o fragmentos también cuentan como primera canción."
  },
  {
    id: 11,
    question: "¿Qué trae Bad Bunny en la cabeza al salir?",
    options: ["Gorra de béisbol", "Sombrero de paja/vaquero", "Nada (pelo suelto)", "Otro accesorio"],
    category: "halftime",
    explanation: "Cuenta lo que traiga puesto en la cabeza cuando aparezca por primera vez en el escenario. Si se lo quita después, no importa - solo cuenta el momento inicial."
  },
  {
    id: 12,
    question: "¿Quién será el invitado sorpresa?",
    options: ["Cardi B", "J Balvin", "Jennifer Lopez", "Nadie / Otro artista"],
    category: "halftime",
    explanation: "Casi siempre hay invitados sorpresa en el show. Debe aparecer físicamente en el escenario cantando o bailando. Videos o voces grabadas no cuentan."
  },
  {
    id: 13,
    question: "Total de Canciones en el Show",
    options: ["12 o más (Over)", "11 o menos (Under)"],
    category: "halftime",
    explanation: "Cuenta el total de canciones que suenen, aunque sean fragmentos cortos o medleys. Si mezcla 3 canciones en un minuto, cuentan las 3."
  },

  // --- FINAL RESULTS ---
  {
    id: 14,
    question: "GANADOR DEL SUPER BOWL LX",
    options: ["Seattle Seahawks", "New England Patriots"],
    category: "final",
    highlight: true,
    explanation: "La pregunta más importante. ¿Quién levantará el Trofeo Vince Lombardi como campeón de la NFL?"
  },
  {
    id: 15,
    question: "Total de Puntos Combinados",
    options: ["Más de 45.5 (Over)", "Menos de 45.5 (Under)"],
    category: "final",
    explanation: "Suma los puntos de AMBOS equipos al final. Ejemplo: Seahawks 24 + Patriots 21 = 45 puntos (sería Under). Si suman 46 o más, es Over."
  },
  {
    id: 16,
    question: "MVP del Super Bowl",
    options: ["Un Quarterback", "Receptor o Corredor", "Jugador Defensivo"],
    category: "final",
    highlight: true,
    explanation: "El Jugador Más Valioso del partido. Usualmente es el QB del equipo ganador, pero a veces un receptor espectacular o un defensor dominante se lo lleva."
  },
  {
    id: 17,
    question: "Color del Gatorade al Entrenador",
    options: ["Naranja", "Amarillo/Verde Lima", "Azul", "Otro color / No le tiran"],
    category: "final",
    explanation: "Tradición del Super Bowl: los jugadores le vacían una hielera de Gatorade al entrenador ganador. Naranja y Amarillo son los colores más comunes históricamente."
  }
];

export const eventInfo = {
  name: "Super Bowl LX",
  number: 60,
  date: "8 de Febrero, 2026",
  venue: "Levi's Stadium",
  location: "Santa Clara, CA",
  teams: {
    home: {
      name: "Seattle Seahawks",
      short: "Seahawks",
      colors: { primary: "#002244", secondary: "#69BE28" }
    },
    away: {
      name: "New England Patriots",
      short: "Patriots",
      colors: { primary: "#002244", secondary: "#C60C30" }
    }
  },
  halftime: "Bad Bunny",
  anthem: "Charlie Puth",
  entryFee: 500
};

export const rules = [
  "La entrada es de $500 MXN por participante.",
  "Cada pregunta acertada vale 10 puntos.",
  "La pregunta del ganador vale 20 puntos.",
  "En caso de empate, gana quien haya acertado el total de puntos.",
  "El ganador se lleva el 100% del bote.",
  "Las predicciones se cierran al inicio del partido.",
  "El admin tiene la última palabra en casos de controversia."
];
