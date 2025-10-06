export interface SubtopicStudyGuide {
  name: string;
  summary: string;
  keyPoints: string[];
  practiceIdeas: string[];
  resources?: string[];
}

export interface TopicStudyGuide {
  name: string;
  summary: string;
  objectives: string[];
  studyTips: string[];
  subtopics: SubtopicStudyGuide[];
  resources?: string[];
}

type KnowledgeBase = Record<string, TopicStudyGuide[]>;

const syllabusKnowledgeBase: KnowledgeBase = {
  "calculo integral": [
    {
      name: "Integrales definidas",
      summary: "Repasa el concepto de integral definida, su interpretacion geometrica y la relacion con el teorema fundamental del calculo.",
      objectives: [
        "Recordar el significado geometrico del area firmada",
        "Aplicar el teorema fundamental del calculo en ejemplos guiados",
        "Reconocer cuando una integral definida representa acumulacion o variacion neta"
      ],
      studyTips: [
        "Antes de integrar, verifica los limites y el comportamiento de la funcion en el intervalo",
        "Bosqueja la grafica rapida para entender cambios de signo",
        "Justifica cada paso del procedimiento indicando la regla utilizada"
      ],
      subtopics: [
        {
          name: "Metodo de sustitucion",
          summary: "Usa cambios de variable para simplificar integrales con funciones compuestas.",
          keyPoints: [
            "Identifica una expresion interna como candidata a la sustitucion",
            "Recuerda transformar los limites cuando cambias de variable",
            "Comprueba tu resultado derivando la antiderivada obtenida"
          ],
          practiceIdeas: [
            "Resuelve tres integrales con sustitucion lineal",
            "Evalua una integral que requiera sustitucion trigonometrica",
            "Contrasta tus respuestas con un software CAS o calculadora graficadora"
          ],
          resources: [
            "https://www.khanacademy.org/math/integral-calculus/indefinite-integrals/substitution-u-substitution/v/indefinite-integrals-with-u-substitution-getting-ready-to-substitute",
            "https://mathispower4u.com/integration.php"
          ]
        },
        {
          name: "Regla de partes",
          summary: "Aplica integracion por partes cuando el integrando es el producto de dos funciones.",
          keyPoints: [
            "Utiliza el acronimo LIATE para elegir u y dv",
            "Documenta cada iteracion si debes aplicar la tecnica mas de una vez",
            "Combina la regla de partes con sustitucion si el integrando lo requiere"
          ],
          practiceIdeas: [
            "Integra productos polinomio por exponencial",
            "Analiza un problema fisico donde aparezca trabajo o energia acumulada",
            "Construye una tabla de reduccion para integrales de senos y cosenos a diferentes potencias"
          ],
          resources: [
            "https://tutorial.math.lamar.edu/Classes/CalcII/IntegrationByParts.aspx",
            "https://pomodoromarathon.com/blog/calculo/guia-integracion-por-partes"
          ]
        }
      ],
      resources: [
        "https://www.geogebra.org/m/vpfk28my"
      ]
    },
    {
      name: "Aplicaciones de integrales",
      summary: "Relaciona la integral con calculos de area, volumen y trabajo fisico.",
      objectives: [
        "Configurar integrales para volumenes de solidos de revolucion",
        "Distinguir entre metodos de discos, anillos y cascarones",
        "Interpretar integrales como trabajo mecanico o masa acumulada"
      ],
      studyTips: [
        "Empieza con un diagrama claro de la region a rotar",
        "Escribe la expresion diferencial antes de integrar",
        "Verifica las unidades de tu resultado final"
      ],
      subtopics: [
        {
          name: "Volumen por discos",
          summary: "Usa discos o anillos para modelar solidos de revolucion alrededor de un eje.",
          keyPoints: [
            "Determina si el eje de rotacion requiere anillos o discos simples",
            "Formula el radio en funcion de la variable de integracion",
            "Comprueba si necesitas dividir la integral por cambios de dominio"
          ],
          practiceIdeas: [
            "Calcula el volumen generado por la region entre y = x^2 y y = 4 al rotar sobre el eje x",
            "Resuelve un ejercicio donde el eje de rotacion sea una recta horizontal desplazada",
            "Compara resultados obtenidos con discos versus cascarones en un mismo problema"
          ],
          resources: [
            "https://www.youtube.com/watch?v=Zb6p3nQf8iM"
          ]
        },
        {
          name: "Trabajo y energia",
          summary: "Traduce situaciones fisicas (bombear liquidos, comprimir resortes) en integrales definidas.",
          keyPoints: [
            "Expresa la fuerza diferencial en funcion de la posicion",
            "Define claramente los limites segun el desplazamiento real",
            "Usa unidades coherentes para fuerza, distancia y trabajo"
          ],
          practiceIdeas: [
            "Modela el trabajo necesario para comprimir un resorte con ley de Hooke",
            "Calcula el trabajo para bombear agua de un tanque con seccion variable",
            "Explica como afecta la densidad del fluido al resultado final"
          ],
          resources: [
            "https://www.khanacademy.org/science/physics/work-and-energy"
          ]
        }
      ],
      resources: [
        "https://www.khanacademy.org/math/integral-calculus/applications-integrals"
      ]
    }
  ],
  "programacion orientada a objetos": [
    {
      name: "Principios SOLID",
      summary: "Profundiza en los principios SOLID para crear software mantenible y extensible.",
      objectives: [
        "Reconocer cada principio SOLID y su beneficio practico",
        "Identificar olores de codigo que violan SOLID",
        "Refactorizar ejemplos sencillos aplicando SOLID"
      ],
      studyTips: [
        "Analiza clases reales de tus proyectos y evalua si cumplen SOLID",
        "Comparte tus refactorizaciones con un companero para recibir retroalimentacion",
        "Documenta antes y despues de cada cambio para ver el impacto"
      ],
      subtopics: [
        {
          name: "Responsabilidad unica",
          summary: "Cada clase debe enfocarse en una sola responsabilidad.",
          keyPoints: [
            "Detecta clases que gestionan multiples procesos",
            "Extrae servicios o utilidades especializados",
            "Usa nombres claros que describan la responsabilidad principal"
          ],
          practiceIdeas: [
            "Divide una clase muy grande en componentes mas pequenos",
            "Escribe pruebas unitarias que fallen antes de refactorizar",
            "Revisa commits para asegurar que cada cambio aborda una sola responsabilidad"
          ],
          resources: [
            "https://martinfowler.com/bliki/SingleResponsibilityPrinciple.html"
          ]
        },
        {
          name: "Inversion de dependencias",
          summary: "Asegura que las dependencias apunten a abstracciones y no a clases concretas.",
          keyPoints: [
            "Declara interfaces para describir comportamientos clave",
            "Inyecta dependencias mediante constructores o contenedores IoC",
            "Evita crear instancias dentro de componentes de alto nivel"
          ],
          practiceIdeas: [
            "Implementa un servicio usando interfaces y un contenedor de inyeccion",
            "Configura pruebas con dobles (mocks) para verificar interacciones",
            "Dibuja un diagrama de dependencias antes y despues de aplicar el principio"
          ],
          resources: [
            "https://www.youtube.com/watch?v=QoO0fGur6kA"
          ]
        }
      ],
      resources: [
        "https://solidprinciples.com/"
      ]
    },
    {
      name: "Patrones de diseno basicos",
      summary: "Introduce patrones de creacion y estructura para resolver problemas recurrentes.",
      objectives: [
        "Relacionar problemas comunes con patrones conocidos",
        "Implementar Factory Method y Singleton en TypeScript o JavaScript",
        "Evaluar ventajas y desventajas de cada patron"
      ],
      studyTips: [
        "Compara implementaciones en diferentes lenguajes",
        "Documenta que problema resuelve cada patron antes de codificarlo",
        "Practica escribiendo diagramas simples para reforzar la comprension"
      ],
      subtopics: [
        {
          name: "Factory Method",
          summary: "Centraliza la creacion de objetos para desacoplar clientes de implementaciones concretas.",
          keyPoints: [
            "Define una interfaz creadora con un metodo fabrica",
            "Permite que subclases decidan que objeto concreto instanciar",
            "Asegura que los clientes dependan de la interfaz y no de clases especificas"
          ],
          practiceIdeas: [
            "Crea una fabrica para generar reportes en PDF y CSV",
            "Integra el patron con inyeccion de dependencias",
            "Describe como probarias la fabrica usando dobles"
          ],
          resources: [
            "https://refactoring.guru/design-patterns/factory-method"
          ]
        },
        {
          name: "Singleton",
          summary: "Restringe la creacion de instancias a un unico objeto compartido.",
          keyPoints: [
            "Controla el acceso al constructor",
            "Expone un metodo estatico para obtener la instancia",
            "Considera las implicaciones en pruebas y concurrencia"
          ],
          practiceIdeas: [
            "Implementa un gestor de configuraciones como singleton",
            "Analiza los riesgos de usar singleton en ambientes concurrentes",
            "Evalua cuando reemplazar un singleton por inyeccion de dependencias"
          ],
          resources: [
            "https://refactoring.guru/design-patterns/singleton"
          ]
        }
      ],
      resources: [
        "https://refactoring.guru/design-patterns/catalog"
      ]
    }
  ]
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .toLowerCase()
    .trim();
}

export function getMateriaTopicCatalog(materiaName: string): TopicStudyGuide[] {
  const key = normalizeName(materiaName);
  return syllabusKnowledgeBase[key] || [];
}

export function getTopicStudyGuide(materiaName: string, topicName: string): TopicStudyGuide | null {
  const topics = getMateriaTopicCatalog(materiaName);
  const normalized = normalizeName(topicName);
  return topics.find(topic => normalizeName(topic.name) === normalized) || null;
}

export function getSubtopicStudyGuide(
  materiaName: string,
  topicName: string,
  subtopicName: string
): { topic: TopicStudyGuide; subtopic: SubtopicStudyGuide } | null {
  const topic = getTopicStudyGuide(materiaName, topicName);
  if (!topic) {
    return null;
  }
  const normalized = normalizeName(subtopicName);
  const subtopic = topic.subtopics.find(item => normalizeName(item.name) === normalized);
  if (!subtopic) {
    return null;
  }
  return { topic, subtopic };
}

export function formatStudyGuideResponse(params: {
  materia: string;
  topic: TopicStudyGuide;
  subtopic?: SubtopicStudyGuide;
}): string {
  const { materia, topic, subtopic } = params;
  const lines: string[] = [];

  lines.push(`${materia} - ${subtopic ? subtopic.name : topic.name}`);
  lines.push("");

  if (subtopic) {
    lines.push(`Resumen: ${subtopic.summary}`);
    lines.push("");
    if (subtopic.keyPoints.length > 0) {
      lines.push("Puntos clave:");
      subtopic.keyPoints.forEach(point => lines.push(`- ${point}`));
      lines.push("");
    }
    if (subtopic.practiceIdeas.length > 0) {
      lines.push("Practica sugerida:");
      subtopic.practiceIdeas.forEach(item => lines.push(`- ${item}`));
      lines.push("");
    }
    if (subtopic.resources && subtopic.resources.length > 0) {
      lines.push("Recursos recomendados:");
      subtopic.resources.forEach(url => lines.push(`- ${url}`));
      lines.push("");
    }
  } else {
    lines.push(`Resumen: ${topic.summary}`);
    lines.push("");
    if (topic.objectives.length > 0) {
      lines.push("Objetivos de repaso:");
      topic.objectives.forEach(goal => lines.push(`- ${goal}`));
      lines.push("");
    }
    if (topic.studyTips.length > 0) {
      lines.push("Consejos de estudio:");
      topic.studyTips.forEach(tip => lines.push(`- ${tip}`));
      lines.push("");
    }
    if (topic.subtopics.length > 0) {
      lines.push("Subtemas relacionados:");
      topic.subtopics.forEach(item => lines.push(`- ${item.name}: ${item.summary}`));
      lines.push("");
    }
    if (topic.resources && topic.resources.length > 0) {
      lines.push("Recursos recomendados:");
      topic.resources.forEach(url => lines.push(`- ${url}`));
      lines.push("");
    }
  }

  lines.push(generateStudyLinks(subtopic ? subtopic.name : topic.name, materia));
  return lines.join("\n");
}

export function generateStudyLinks(topicName: string, materiaName?: string): string {
  const encodedTopic = encodeURIComponent(topicName);
  const encodedMateria = materiaName ? encodeURIComponent(materiaName) : encodedTopic;

  const lines: string[] = [];
  lines.push("Recursos adicionales:");
  lines.push(`- YouTube: https://www.youtube.com/results?search_query=${encodedMateria}+${encodedTopic}+explicacion`);
  lines.push(`- Google Scholar: https://scholar.google.com/scholar?q=${encodedMateria}+${encodedTopic}`);
  lines.push(`- Khan Academy: https://es.khanacademy.org/search?page_search_query=${encodedTopic}`);
  lines.push(`- Busqueda general: https://www.google.com/search?q=${encodedMateria}+${encodedTopic}+ejercicios`);
  return lines.join("\n");
}
