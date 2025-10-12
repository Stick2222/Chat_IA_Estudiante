// lib/openaiService.ts - VERSIÓN CON FUNCTION CALLING, SÍLABO Y ENLACES CLICABLES (LABEL)
import OpenAI from "openai";
import { UserContext } from "../app/types/chatbot";

export class ChatbotService {
  private openai: OpenAI | null = null;
  private chatHistory: Array<{
    role: "system" | "user" | "assistant" | "function";
    content: string;
    name?: string;
    // @ts-ignore: para almacenar function_call en historial si es necesario
    function_call?: any;
  }> = [];
  private useFallback: boolean = false;
  private lastImageHash: string | null = null;

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey || !apiKey.startsWith("sk-")) {
      console.warn("❌ OpenAI API Key no válida");
      this.useFallback = true;
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      });
      console.log("✅ OpenAI inicializado");
    } catch (error) {
      console.error("❌ Error inicializando OpenAI:", error);
      this.useFallback = true;
    }
  }

  private getSystemPrompt(userContext?: UserContext): string {
    return `Eres "EduBot", un asistente educativo universitario experto y empático.

DATOS DEL ESTUDIANTE:
- Nombre: ${userContext?.nombre || "Usuario"}
- Sesión activa: ${userContext?.isLoggedIn ? "Sí" : "No"}
- Fecha actual: ${new Date().toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Hora actual: ${new Date().toLocaleTimeString("es-EC")}

INSTRUCCIONES CRÍTICAS:
1. Mantén el contexto y responde como tutor amigable.
2. Usa las funciones disponibles cuando corresponda.
3. Flujo de refuerzo de temas:
   - Si el estudiante pide ayuda en una materia, PRIMERO usa obtener_silabo_materia
   - Muestra los temas disponibles y permite elegir
   - Luego usa buscar_recursos_estudio para el tema/subtema elegido
4. Recomienda material si detectas < 70 en cualquier materia.
5. Conecta con lo conversado previamente.

ESCALA:
- 90-100 Excelente 🏆
- 80-89 Muy bueno ⭐
- 70-79 Satisfactorio ✅
- < 70 Mejora urgente ⚠️

FORMATO ESPECIAL PARA ENLACES:
- No escribas URLs sueltas.
- Usa [LINK:url|Texto] o [LINK:url].

FUNCIONES:
- obtener_calificaciones
- obtener_silabo_materia
- buscar_recursos_estudio

ESTILO:
- Natural, directo, empático, con emojis solo si aportan.`;
  }

  // ===== DEFINICIÓN DE FUNCIONES PARA FUNCTION CALLING =====
  private getFunctionDefinitions() {
    return [
      {
        name: "obtener_calificaciones",
        description:
          "Obtiene calificaciones y datos académicos del estudiante.",
        parameters: {
          type: "object",
          properties: {
            tipo_consulta: {
              type: "string",
              enum: [
                "todas",
                "promedio",
                "mejor",
                "peor",
                "materias",
                "aulas",
                "especifica",
              ],
            },
            materia_especifica: { type: "string" },
          },
          required: ["tipo_consulta"],
        },
      },
      {
        name: "obtener_silabo_materia",
        description:
          "Obtiene el sílabo completo (temas y subtemas) de una materia.",
        parameters: {
          type: "object",
          properties: {
            materia: { type: "string" },
            periodo: { type: "string" },
          },
          required: ["materia"],
        },
      },
      {
        name: "buscar_recursos_estudio",
        description:
          "Busca recursos para una materia/tema/subtema específicos.",
        parameters: {
          type: "object",
          properties: {
            materia: { type: "string" },
            tema_especifico: { type: "string" },
            subtema_especifico: { type: "string" },
            tipo_recurso: {
              type: "string",
              enum: ["videos", "tutoriales", "ejercicios", "general"],
            },
            nivel_urgencia: {
              type: "string",
              enum: ["alta", "media", "baja"],
            },
          },
          required: ["materia"],
        },
      },
    ];
  }

  // ===== CONVERSIÓN DE [LINK:...] → <a href="...">Texto</a>
  private makeLinksClickable(text: string): string {
    if (!text) return text;

    // Soporta [LINK:https://...|Texto visible] y [LINK:https://...]
    return text.replace(
      /\[LINK:(https?:\/\/[^\]\s\|]+)(?:\|([^\]]+))?\]/g,
      (_m, url, label) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${
          label || "Enlace"
        }</a>`
    );
  }

  // ===== IMPLEMENTACIÓN DE FUNCIONES =====
  private async ejecutarFuncion(
    functionName: string,
    functionArgs: any,
    userContext?: UserContext
  ): Promise<string> {
    console.log(`🔧 Ejecutando función: ${functionName}`, functionArgs);

    try {
      switch (functionName) {
        case "obtener_calificaciones":
          return await this.obtenerCalificaciones(functionArgs, userContext);

        case "obtener_silabo_materia":
          return await this.obtenerSilaboMateria(functionArgs, userContext);

        case "buscar_recursos_estudio":
          return await this.buscarRecursosEstudio(functionArgs);

        default:
          return JSON.stringify({ error: "Función no reconocida" });
      }
    } catch (error: any) {
      console.error(`❌ Error ejecutando ${functionName}:`, error);
      return JSON.stringify({
        error: "Error al ejecutar la función",
        detalles: error.message,
      });
    }
  }

  private async obtenerCalificaciones(
    args: any,
    userContext?: UserContext
  ): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return JSON.stringify({
        error: "No autenticado",
        mensaje:
          "El estudiante debe iniciar sesión para consultar calificaciones",
      });
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mis-inscripciones/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userContext.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const inscripciones = await response.json();

      if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
        return JSON.stringify({
          mensaje: "No se encontraron materias inscritas",
          inscripciones: [],
        });
      }

      return this.procesarConsultaCalificaciones(inscripciones, args);
    } catch (error: any) {
      return JSON.stringify({
        error: "Error al obtener datos",
        mensaje: error.message,
      });
    }
  }

  private procesarConsultaCalificaciones(
    inscripciones: any[],
    args: any
  ): string {
    const tipo = args.tipo_consulta;
    const materiaEspecifica = args.materia_especifica?.toLowerCase();

    const conNota = inscripciones.filter(
      (i) => i.calificacion !== null && i.calificacion !== undefined
    );

    const resultado: any = {
      total_materias: inscripciones.length,
      materias_calificadas: conNota.length,
      materias: [],
    };

    switch (tipo) {
      case "todas":
        resultado.materias = inscripciones.map((i) => ({
          nombre: i.paralelo?.materia?.nombre || "Materia desconocida",
          calificacion: i.calificacion,
          aula: i.paralelo?.aula || "No asignada",
          paralelo: i.paralelo?.numero_paralelo || "N/A",
          carrera: i.carrera?.nombre || "N/A",
        }));
        break;

      case "promedio":
        if (conNota.length > 0) {
          const promedio =
            conNota.reduce((acc, i) => acc + i.calificacion, 0) /
            conNota.length;
          resultado.promedio = parseFloat(promedio.toFixed(2));
        } else {
          resultado.promedio = null;
          resultado.mensaje = "No hay calificaciones disponibles";
        }
        break;

      case "mejor":
        if (conNota.length > 0) {
          const mejor = conNota.reduce((max, i) =>
            i.calificacion > max.calificacion ? i : max
          );
          resultado.mejor_materia = {
            nombre: mejor.paralelo?.materia?.nombre,
            calificacion: mejor.calificacion,
            aula: mejor.paralelo?.aula,
            paralelo: mejor.paralelo?.numero_paralelo,
          };
        }
        break;

      case "peor":
        if (conNota.length > 0) {
          const peor = conNota.reduce((min, i) =>
            i.calificacion < min.calificacion ? i : min
          );
          resultado.peor_materia = {
            nombre: peor.paralelo?.materia?.nombre,
            calificacion: peor.calificacion,
            aula: peor.paralelo?.aula,
            paralelo: peor.paralelo?.numero_paralelo,
          };

          if (peor.calificacion < 70) {
            resultado.necesita_recursos = true;
            resultado.materia_critica = peor.paralelo?.materia?.nombre;
          }
        }
        break;

      case "especifica":
        if (materiaEspecifica) {
          const materiaEncontrada = inscripciones.find((i) =>
            i.paralelo?.materia?.nombre
              ?.toLowerCase()
              .includes(materiaEspecifica)
          );

          if (materiaEncontrada) {
            resultado.materia = {
              nombre: materiaEncontrada.paralelo?.materia?.nombre,
              calificacion: materiaEncontrada.calificacion,
              aula: materiaEncontrada.paralelo?.aula,
              paralelo: materiaEncontrada.paralelo?.numero_paralelo,
              carrera: materiaEncontrada.carrera?.nombre,
            };
          } else {
            resultado.error = `No se encontró la materia: ${materiaEspecifica}`;
          }
        }
        break;

      case "materias":
      case "aulas":
        resultado.materias = inscripciones.map((i) => ({
          nombre: i.paralelo?.materia?.nombre || "Materia desconocida",
          aula: i.paralelo?.aula || "No asignada",
          paralelo: i.paralelo?.numero_paralelo || "N/A",
          calificacion: i.calificacion,
        }));
        break;
    }

    const materiasCriticas = conNota.filter((i) => i.calificacion < 70);
    if (materiasCriticas.length > 0) {
      resultado.materias_necesitan_atencion = materiasCriticas.map((i) => ({
        nombre: i.paralelo?.materia?.nombre,
        calificacion: i.calificacion,
      }));
    }

    return JSON.stringify(resultado);
  }

  private async obtenerSilaboMateria(
    args: any,
    userContext?: UserContext
  ): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return JSON.stringify({
        error: "No autenticado",
        mensaje: "El estudiante debe iniciar sesión para consultar sílabos",
      });
    }

    const materia = args.materia;
    const periodo = args.periodo;

    try {
      // Obtener período activo si no se especifica
      let periodoActivo = periodo;
      if (!periodoActivo) {
        const periodosResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/periodo-academico/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${userContext.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (periodosResponse.ok) {
          const periodos = await periodosResponse.json();
          const activo = periodos.find((p: any) => p.activo);
          periodoActivo = activo?.id;
        }
      }

      // Buscar sílabos de la materia
      const silabosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/silabo/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userContext.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!silabosResponse.ok) {
        throw new Error(`Error HTTP: ${silabosResponse.status}`);
      }

      const silabos = await silabosResponse.json();

      const silabosMateria = silabos.filter((silabo: any) =>
        silabo.materia?.nombre
          ?.toLowerCase()
          .includes(materia.toLowerCase())
      );

      if (silabosMateria.length === 0) {
        return JSON.stringify({
          error: "No se encontró sílabo",
          mensaje: `No se encontró sílabo para la materia: ${materia}`,
          materia,
        });
      }

      const silabo = periodoActivo
        ? silabosMateria.find((s: any) => s.periodo === periodoActivo) ||
          silabosMateria[0]
        : silabosMateria[0];

      const resultado = {
        materia: silabo.materia?.nombre || materia,
        periodo: silabo.periodo_detalle?.codigo || "N/A",
        titulo: silabo.titulo,
        descripcion: silabo.descripcion,
        temas:
          silabo.temas?.map((tema: any) => ({
            id: tema.id,
            titulo: tema.titulo,
            descripcion: tema.descripcion,
            semana: tema.semana,
            orden: tema.orden,
            subtemas:
              tema.subtemas?.map((subtema: any) => ({
                id: subtema.id,
                titulo: subtema.titulo,
                descripcion: subtema.descripcion,
                recursos: subtema.recursos,
                orden: subtema.orden,
              })) || [],
          })) || [],
        total_temas: silabo.temas?.length || 0,
        mensaje: `Sílabo encontrado para ${silabo.materia?.nombre}. Puedes elegir un tema específico para reforzar.`,
      };

      return JSON.stringify(resultado);
    } catch (error: any) {
      return JSON.stringify({
        error: "Error al obtener sílabo",
        mensaje: error.message,
      });
    }
  }

  private async buscarRecursosEstudio(args: any): Promise<string> {
    const materia = args.materia;
    const temaEspecifico = args.tema_especifico;
    const subtemaEspecifico = args.subtema_especifico;
    const tipoRecurso = args.tipo_recurso || "general";
    const urgencia = args.nivel_urgencia || "media";

    const recursos = this.generarRecursosEducativos(
      materia,
      tipoRecurso,
      urgencia,
      temaEspecifico,
      subtemaEspecifico
    );

    return JSON.stringify({
      materia,
      tema_especifico: temaEspecifico || null,
      subtema_especifico: subtemaEspecifico || null,
      tipo_recurso: tipoRecurso,
      urgencia,
      recursos,
      mensaje_formateado: this.formatearRecursosParaGPT(recursos),
    });
  }

  private generarRecursosEducativos(
    materia: string,
    tipo: string,
    urgencia: string,
    temaEspecifico?: string,
    subtemaEspecifico?: string
  ): any[] {
    const recursos: any[] = [];

    // Construir término de búsqueda
    let terminoBusqueda = materia;
    if (temaEspecifico) terminoBusqueda += ` ${temaEspecifico}`;
    if (subtemaEspecifico) terminoBusqueda += ` ${subtemaEspecifico}`;

    // YouTube
    recursos.push({
      plataforma: "YouTube",
      tipo: "Videos educativos",
      descripcion: temaEspecifico
        ? `Videos específicos sobre ${temaEspecifico} en ${materia}`
        : "Videos explicativos en español",
      enlaces: [
        {
          texto: "Tutorial en español",
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            terminoBusqueda + " tutorial español"
          )}`,
        },
        {
          texto: "Explicación paso a paso",
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            terminoBusqueda + " explicación paso a paso"
          )}`,
        },
        ...(temaEspecifico
          ? [
              {
                texto: `Explicación de ${temaEspecifico}`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                  temaEspecifico + " " + materia + " explicación"
                )}`,
              },
            ]
          : []),
      ],
    });

    // Khan Academy
    recursos.push({
      plataforma: "Khan Academy",
      tipo: "Cursos interactivos",
      descripcion: temaEspecifico
        ? `Cursos interactivos sobre ${temaEspecifico} en ${materia}`
        : "Cursos gratuitos con ejercicios prácticos",
      enlace: {
        texto: "Buscar en Khan Academy",
        url: `https://es.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(
          terminoBusqueda
        )}`,
      },
    });

    // Coursera
    recursos.push({
      plataforma: "Coursera",
      tipo: "Cursos universitarios",
      descripcion: temaEspecifico
        ? `Cursos universitarios sobre ${temaEspecifico} en ${materia}`
        : "Cursos de universidades reconocidas",
      enlace: {
        texto: "Buscar en Coursera",
        url: `https://www.coursera.org/search?query=${encodeURIComponent(
          terminoBusqueda
        )}`,
      },
    });

    // MIT OCW
    recursos.push({
      plataforma: "MIT OpenCourseWare",
      tipo: "Material académico avanzado",
      descripcion: temaEspecifico
        ? `Material del MIT sobre ${temaEspecifico} en ${materia}`
        : "Recursos del MIT de acceso libre",
      enlace: {
        texto: "Buscar en MIT OCW",
        url: `https://ocw.mit.edu/search/?q=${encodeURIComponent(
          terminoBusqueda
        )}`,
      },
    });

    // Ejercicios prácticos
    if (tipo === "ejercicios" || urgencia === "alta") {
      recursos.push({
        plataforma: "Varios",
        tipo: "Ejercicios resueltos",
        descripcion: temaEspecifico
          ? `Ejercicios específicos sobre ${temaEspecifico} en ${materia}`
          : "Problemas resueltos paso a paso",
        enlaces: [
          {
            texto: "Ejercicios resueltos PDF",
            url: `https://www.google.com/search?q=${encodeURIComponent(
              terminoBusqueda + " ejercicios resueltos pdf"
            )}`,
          },
          {
            texto: "Problemas paso a paso",
            url: `https://www.google.com/search?q=${encodeURIComponent(
              terminoBusqueda + " problemas resueltos paso a paso"
            )}`,
          },
          ...(temaEspecifico
            ? [
                {
                  texto: `Ejercicios de ${temaEspecifico}`,
                  url: `https://www.google.com/search?q=${encodeURIComponent(
                    temaEspecifico + " " + materia + " ejercicios prácticos"
                  )}`,
                },
              ]
            : []),
        ],
      });
    }

    // Recursos extra con tema específico
    if (temaEspecifico) {
      recursos.push({
        plataforma: "Google Scholar",
        tipo: "Artículos académicos",
        descripcion: `Artículos académicos sobre ${temaEspecifico} en ${materia}`,
        enlace: {
          texto: "Buscar en Google Scholar",
          url: `https://scholar.google.com/scholar?q=${encodeURIComponent(
            terminoBusqueda
          )}`,
        },
      });

      recursos.push({
        plataforma: "Stack Overflow",
        tipo: "Preguntas y respuestas técnicas",
        descripcion: `Preguntas técnicas sobre ${temaEspecifico} en ${materia}`,
        enlace: {
          texto: "Buscar en Stack Overflow",
          url: `https://stackoverflow.com/search?q=${encodeURIComponent(
            terminoBusqueda
          )}`,
        },
      });
    }

    return recursos;
  }

  private formatearRecursosParaGPT(recursos: any[]): string {
    let texto = "\n📚 **RECURSOS EDUCATIVOS ENCONTRADOS**\n\n";
    texto +=
      "⚠️ IMPORTANTE: Usa el formato [LINK:url|Texto] para TODOS los enlaces.\n\n";

    recursos.forEach((recurso, index) => {
      texto += `${index + 1}. **${recurso.plataforma}**\n`;
      texto += `   - ${recurso.descripcion}\n`;

      if (Array.isArray(recurso.enlaces)) {
        recurso.enlaces.forEach((enlace: any) => {
          const label = enlace.texto || "Enlace";
          texto += `   - ${label}: [LINK:${enlace.url}|${label}]\n`;
        });
      } else if (recurso.enlace) {
        const label = recurso.enlace.texto || "Enlace";
        texto += `   - ${label}: [LINK:${recurso.enlace.url}|${label}]\n`;
      }
      texto += "\n";
    });

    texto += "\n💡 **Instrucción para presentación:**\n";
    texto +=
      "Presenta estos recursos de forma amigable manteniendo EXACTAMENTE el formato [LINK:url|Texto].\n";

    return texto;
  }

  // ===== LOOP PRINCIPAL =====
  async sendMessage(message: string, userContext?: UserContext): Promise<string> {
    if (this.useFallback || !this.openai) {
      return "El servicio de IA no está disponible. Configura la API Key de OpenAI.";
    }

    try {
      if (this.chatHistory.length === 0) {
        this.chatHistory = [
          { role: "system", content: this.getSystemPrompt(userContext) },
        ];
      }

      this.chatHistory.push({ role: "user", content: message });

      let iteraciones = 0;
      const MAX_ITERACIONES = 5;

      while (iteraciones < MAX_ITERACIONES) {
        iteraciones++;

        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo-0125",
          messages: this.chatHistory as any,
          functions: this.getFunctionDefinitions(),
          function_call: "auto",
          temperature: 0.7,
          max_tokens: 1500,
        });

        const choice = response.choices[0];
        const finishReason = choice.finish_reason;

        if (finishReason === "function_call" && choice.message.function_call) {
          const functionName = choice.message.function_call.name;
          const functionArgs = JSON.parse(
            choice.message.function_call.arguments || "{}"
          );

          this.chatHistory.push({
            role: "assistant",
            content: choice.message.content || "",
            function_call: choice.message.function_call,
          });

          const functionResult = await this.ejecutarFuncion(
            functionName,
            functionArgs,
            userContext
          );

          this.chatHistory.push({
            role: "function",
            name: functionName,
            content: functionResult,
          });

          // Auto-trigger: traer sílabo si hay materia crítica
          try {
            const resultObj = JSON.parse(functionResult);
            if (resultObj?.necesita_recursos && resultObj?.materia_critica) {
              const silaboResult = await this.ejecutarFuncion(
                "obtener_silabo_materia",
                { materia: resultObj.materia_critica },
                userContext
              );
              this.chatHistory.push({
                role: "function",
                name: "obtener_silabo_materia",
                content: silaboResult,
              });
            }
          } catch {
            // ignorar si no es JSON
          }

          continue; // vuelve a pedir a OpenAI que genere respuesta final
        } else {
          const assistantResponse =
            choice.message.content || "No pude generar una respuesta.";

          this.chatHistory.push({ role: "assistant", content: assistantResponse });

          // Mantener historial acotado
          if (this.chatHistory.length > 20) {
            const systemMessage = this.chatHistory[0];
            const recent = this.chatHistory.slice(-19);
            this.chatHistory = [systemMessage, ...recent];
          }

          // ✅ Devolver respuesta sin convertir enlaces (MessageRenderer se encarga)
          return assistantResponse;
        }
      }

      return "Lo siento, tuve problemas procesando tu solicitud. ¿Podrías reformularla?";
    } catch (error: any) {
      console.error("❌ Error en sendMessage:", error);
      return `Error: ${error.message}. Por favor intenta nuevamente.`;
    }
  }

  // ===== MULTIMEDIA =====
  async sendMessageWithImage(
    message: string,
    imageFile: File,
    userContext?: UserContext
  ): Promise<string> {
    if (this.useFallback || !this.openai) {
      return "El servicio de análisis de imágenes no está disponible.";
    }

    try {
      const base64Image = await this.fileToBase64(imageFile);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: this.getSystemPrompt(userContext) },
          {
            role: "user",
            content: [
              { type: "text", text: message || "Analiza esta imagen." },
              { type: "image_url", image_url: { url: base64Image } },
            ] as any,
          },
        ],
        max_tokens: 1000,
      });

      const assistantResponse =
        response.choices[0]?.message?.content || "No pude analizar la imagen";

      this.chatHistory.push({ role: "user", content: `[Imagen: ${message}]` });
      this.chatHistory.push({ role: "assistant", content: assistantResponse });

      return assistantResponse;
    } catch (error: any) {
      console.error("❌ Error procesando imagen:", error);
      return "Error al procesar la imagen. Verifica que el archivo sea válido.";
    }
  }

  async sendMessageWithAudio(
    audioFile: File,
    userContext?: UserContext
  ): Promise<string> {
    try {
      console.log("🎙️ Transcribiendo audio...");
      const transcription = await this.transcribeAudio(audioFile);

      if (!transcription || transcription.trim().length < 3) {
        return "No pude entender el audio. Habla más claro e intenta nuevamente.";
      }

      console.log("✅ Transcripción:", transcription);
      return await this.sendMessage(transcription, userContext);
    } catch (error: any) {
      console.error("❌ Error procesando el audio:", error);
      return "Error procesando el audio. Intenta nuevamente.";
    }
  }

  private async transcribeAudio(audioFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-1");
      formData.append("language", "es");

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Error en transcripción: ${response.status}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      console.error("Error en Whisper:", error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ===== AUXILIARES =====
  resetChat(): void {
    this.chatHistory = [];
  }

  getChatHistory(): any[] {
    return this.chatHistory;
  }

  getServiceStatus(): {
    available: boolean;
    mode: "openai" | "fallback";
  } {
    return {
      available: !this.useFallback,
      mode: this.useFallback ? "fallback" : "openai",
    };
  }
}

export const chatbotService = new ChatbotService();
