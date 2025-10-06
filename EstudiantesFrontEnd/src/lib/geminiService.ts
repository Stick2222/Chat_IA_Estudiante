// lib/openaiService.ts - VERSIÓN COMPLETA MEJORADA
import OpenAI from 'openai';
import { UserContext, Enrollment } from '../app/types/chatbot';
import { generateStudyLinks, getTopicStudyGuide, getSubtopicStudyGuide, formatStudyGuideResponse } from '../services/ChatbotService';
export class ChatbotService {
  private openai: OpenAI | null = null;
  private chatHistory: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [];
  private isInitialized: boolean = false;
  private useFallback: boolean = false;
  private lastImageHash: string | null = null;
  private conversationContext: ConversationContext = {
    lastMentionedMateria: null,
    lastQueryType: null,
    pendingAction: null,
    pendingTopicSelection: null
  };

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('❌ OpenAI API Key no encontrada');
      this.useFallback = true;
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      console.warn('❌ Formato de API Key incorrecto');
      this.useFallback = true;
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      
      this.testConnection();
      
    } catch (error) {
      console.error('❌ Error inicializando OpenAI:', error);
      this.useFallback = true;
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.openai) return;
    
    try {
      await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Responde 'OK'" }],
        max_tokens: 5
      });
      console.log('✅ Conexión con OpenAI establecida');
    } catch (error) {
      console.error('❌ Error en test de conexión:', error);
      this.useFallback = true;
    }
  }

  private getSystemContext(userContext?: UserContext): string {
    return `Eres "EduBot", un asistente virtual especializado en educación universitaria.

CONTEXTO DEL USUARIO:
- Nombre: ${userContext?.nombre || 'No disponible'}
- Sesión activa: ${userContext?.isLoggedIn ? 'Sí' : 'No'}
- Tiempo: ${userContext?.timestamp || 'No disponible'}

INFORMACIÓN DISPONIBLE:
Para consultar calificaciones, materias o aulas, el usuario DEBE:
1. Iniciar sesión en el sistema web
2. Acceder a la sección "Mis Calificaciones" o "Mis Materias"

RESPONDE EN ESPAÑOL con:
- Claridad y precisión
- Empatía y utilidad
- Enfoque educativo
- Identifica las materias con calificaciones bajas y recomienda material de apoyo
- La hora y fecha deben estar en formato de Ecuador
- Las calificaciones mayores a 80 son consideradas buenas
- Las de 90 para adelante son excelentes
- Las de 70 son regulares
- Las menores de 70 son consideradas insuficientes
- Si el usuario pide cuál es su calificación mayor, muestra la materia con mayor puntaje
- Si el usuario pide cuál es su calificación menor, muestra la materia con menor puntaje
- Si el usuario pide su promedio, muestra SOLO el promedio general
-En la notas de voz transcribe y ejecuta todas las preguntas que el usuario haga
- Sigue la conversación basada en el contexto del usuario
-TOMA LA HORA Y FECHA DE ECUADOR
- Si el usuario pide información sobre una materia, responde con la información disponible
- Genera roadmaps de mejora automáticamente para materias con calificación menor a 70
- Mantén el contexto de la conversación y sigue el hilo de lo que el estudiante estaba preguntando
-Si en la nota de voz el usuario pregunta un dato especifico transcribe la nota y busca en internet esa informacion.
-Si el usuario tiene una calificacion menor que 70, recomienda material de apoyo sacado de internet que en base a esa materia.
`;
  }

  // ===== DETECCIÓN DE INTENCIONES MEJORADA =====
  
  private isGradeRelated(message: string): boolean {
    const gradeKeywords = [
      'calificacion', 'nota', 'promedio', 'calificación', 'notas', 'nota final', 
      'qué nota tengo', 'mis calificaciones', 'mejor nota', 'peor nota', 
      'nota mas alta', 'nota mas baja', 'mayor calificacion', 'menor calificacion',
      'puntaje', 'puntuación'
    ];
    return gradeKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isAverageQuery(message: string): boolean {
    const averageKeywords = [
      'promedio', 'promedio general', 'mi promedio', 'qué promedio tengo',
      'cual es mi promedio', 'promedio de notas', 'nota promedio'
    ];
    return averageKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isSubjectRelated(message: string): boolean {
    const subjectKeywords = [
      'materia', 'clase', 'asignatura', 'curso', 'mis materias', 
      'qué materias tengo', 'en qué materias estoy', 'cursos'
    ];
    return subjectKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isClassroomRelated(message: string): boolean {
    const classroomKeywords = [
      'aula', 'salón', 'salon', 'clase', 'dónde es la clase', 
      'donde es la clase', 'dónde me toca', 'donde me toca', 
      'ubicación', 'ubicacion', 'lugar de clase'
    ];
    return classroomKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isParaleloRelated(message: string): boolean {
    const paraleloKeywords = [
      'paralelo', 'grupo', 'sección', 'seccion', 'número de clase', 
      'numero de clase', 'qué paralelo'
    ];
    return paraleloKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isBestGradeQuery(message: string): boolean {
    const bestGradeKeywords = [
      'mejor nota', 'mayor calificacion', 'nota mas alta', 'mejor calificacion',
      'mayor nota', 'calificacion mas alta', 'cual es mi mejor', 'en que voy mejor',
      'nota más alta'
    ];
    return bestGradeKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isWorstGradeQuery(message: string): boolean {
    const worstGradeKeywords = [
      'peor nota', 'menor calificacion', 'nota mas baja', 'peor calificacion',
      'menor nota', 'calificacion mas baja', 'cual es mi peor', 'en que voy peor',
      'donde estoy mal', 'que materia debo mejorar', 'nota más baja', 'nota menor',
      'menor puntaje', 'peor puntaje', 'calificacion menor', 'puntaje mas bajo',
      'peor calificacion', 'nota mas pequeña', 'calificacion mas pequeña',
      'en que materia voy peor', 'cual es mi menor', 'mi peor materia',
      'donde tengo menos', 'menor calificacion', 'peor rendimiento'
    ];
    
    const lowerMessage = message.toLowerCase();
    const keywordMatch = worstGradeKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    const patternMatch = 
      /(menor|peor|baja|bajo).*(nota|calificacion|puntaje|materia)/i.test(message) ||
      /(nota|calificacion|puntaje).*(menor|peor|baja|bajo)/i.test(message);
    
    const isWorstGrade = keywordMatch || patternMatch;
    
    console.log('🔍 Detección de peor nota:', {
      message,
      keywordMatch,
      patternMatch,
      isWorstGrade
    });
    
    return isWorstGrade;
  }

  private isRoadmapQuery(message: string): boolean {
    const roadmapKeywords = [
      'ayuda', 'mejorar', 'como mejoro', 'que hago', 'plan de estudio',
      'roadmap', 'estrategia', 'consejos', 'como puedo mejorar', 'recuperar',
      'me ayuda', 'necesito ayuda', 'qué debo hacer', 'recomendación'
    ];
    return roadmapKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isImprovementQuery(message: string): boolean {
    const improvementKeywords = [
      'subir', 'mejorar', 'incrementar', 'aumentar', 'elevar', 'subir nota',
      'mejorar calificación', 'subir calificación', 'recuperar nota'
    ];
    return improvementKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    ) && this.isGradeRelated(message);
  }

  private isSyllabusQuery(message: string): boolean {
    const normalized = this.normalizeText(message);
    const syllabusKeywords = [
      'silabo', 'syllabus', 'tema', 'temas', 'subtema', 'subtemas', 'unidad', 'contenido', 'repasar contenido', 'plan de estudio detallado'
    ];
    return syllabusKeywords.some(keyword => normalized.includes(keyword));
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
      .toLowerCase()
      .trim();
  }

  private areStringsEquivalent(a?: string | null, b?: string | null): boolean {
    if (!a || !b) {
      return false;
    }
    return this.normalizeText(a) === this.normalizeText(b);
  }

  private findMateriaFromMessage(message: string, inscripciones: any[]): string | null {
    const normalizedMessage = this.normalizeText(message);
    for (const inscripcion of inscripciones) {
      const materiaNombre = inscripcion.paralelo?.materia?.nombre;
      if (materiaNombre && normalizedMessage.includes(this.normalizeText(materiaNombre))) {
        return materiaNombre;
      }
    }
    return this.conversationContext.lastMentionedMateria;
  }

  // ===== NUEVA FUNCIÓN: DETECTAR CONSULTA ESPECÍFICA =====
  
  private detectSpecificQuery(message: string, inscripciones: any[]): { 
    type: 'materia' | 'aula' | 'paralelo' | 'none';
    materiaNombre: string | null;
    query: string | null;
  } {
    const lowerMessage = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Detectar si es consulta de aula específica
    const aulaPatterns = [
      /(?:aula|sal[oó]n|ubicaci[oó]n).*(?:de|para|del?)\s+([^?.!]+)/i,
      /(?:d[oó]nde).*(?:es|queda).*(?:la clase|el curso).*?(?:de|del?)\s+([^?.!]+)/i,
      /(?:en qué aula).*(?:es|est[áa]).*?(?:de|del?)\s+([^?.!]+)/i
    ];
    
    for (const pattern of aulaPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const posibleMateria = match[1].trim();
        const materiaEncontrada = this.buscarMateria(inscripciones, posibleMateria);
        if (materiaEncontrada) {
          return { type: 'aula', materiaNombre: materiaEncontrada, query: 'aula' };
        }
      }
    }

    // Detectar si es consulta de paralelo específico
    const paraleloPatterns = [
      /(?:paralelo|grupo|secci[oó]n).*(?:de|para|del?)\s+([^?.!]+)/i,
      /(?:qué paralelo).*(?:tengo|tengo en).*?(?:de|del?)\s+([^?.!]+)/i,
      /(?:en qué paralelo).*(?:estoy|est[áa]).*?(?:de|del?)\s+([^?.!]+)/i
    ];
    
    for (const pattern of paraleloPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const posibleMateria = match[1].trim();
        const materiaEncontrada = this.buscarMateria(inscripciones, posibleMateria);
        if (materiaEncontrada) {
          return { type: 'paralelo', materiaNombre: materiaEncontrada, query: 'paralelo' };
        }
      }
    }

    // Detectar si es consulta de materia específica (calificación)
    const materiaPatterns = [
      /(?:calificaci[oó]n|nota|puntaje).*(?:en|de|para)\s+([^?.!]+)/i,
      /(?:qu[ée]|cu[áa]l).*(?:calificaci[oó]n|nota).*(?:tengo|tengo en|saco).*?(?:en|de)\s+([^?.!]+)/i,
      /(?:en|de)\s+([^?.!]+?)\s+(?:calificaci[oó]n|nota|puntaje)/i,
      /(?:mi|la|el).*(?:calificaci[oó]n|nota).*(?:en|de)\s+([^?.!]+)/i
    ];
    
    for (const pattern of materiaPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const posibleMateria = match[1].trim();
        const materiaEncontrada = this.buscarMateria(inscripciones, posibleMateria);
        if (materiaEncontrada) {
          return { type: 'materia', materiaNombre: materiaEncontrada, query: 'calificacion' };
        }
      }
    }

    // Búsqueda directa por nombre de materia
    for (const inscripcion of inscripciones) {
      const materiaNombre = inscripcion.paralelo?.materia?.nombre;
      if (materiaNombre) {
        const nombreNormalizado = materiaNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (lowerMessage.includes(nombreNormalizado)) {
          // Determinar qué está preguntando basado en palabras clave
          if (lowerMessage.includes('aula') || lowerMessage.includes('salon') || lowerMessage.includes('ubicacion')) {
            return { type: 'aula', materiaNombre: materiaNombre, query: 'aula' };
          } else if (lowerMessage.includes('paralelo') || lowerMessage.includes('grupo') || lowerMessage.includes('seccion')) {
            return { type: 'paralelo', materiaNombre: materiaNombre, query: 'paralelo' };
          } else if (this.isGradeRelated(lowerMessage)) {
            return { type: 'materia', materiaNombre: materiaNombre, query: 'calificacion' };
          } else {
            return { type: 'materia', materiaNombre: materiaNombre, query: 'general' };
          }
        }
      }
    }
    
    return { type: 'none', materiaNombre: null, query: null };
  }

  private buscarMateria(inscripciones: any[], posibleMateria: string): string | null {
    const posibleMateriaNormalizada = posibleMateria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    for (const inscripcion of inscripciones) {
      const materiaNombre = inscripcion.paralelo?.materia?.nombre;
      if (materiaNombre) {
        const nombreNormalizado = materiaNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (nombreNormalizado.includes(posibleMateriaNormalizada) || posibleMateriaNormalizada.includes(nombreNormalizado)) {
          return materiaNombre;
        }
        
        // Buscar por palabras clave
        const palabrasMateria = nombreNormalizado.split(' ');
        for (const palabra of palabrasMateria) {
          if (palabra.length > 4 && posibleMateriaNormalizada.includes(palabra)) {
            return materiaNombre;
          }
        }
      }
    }
    
    return null;
  }

  // ===== FUNCIONES PARA GENERAR RESPUESTAS ESPECÍFICAS =====

  private generateSpecificResponse(inscripciones: any[], materiaNombre: string, queryType: string): string {
    const materiaEncontrada = inscripciones.find(insc => {
      const nombreMateriaInsc = insc.paralelo?.materia?.nombre;
      return nombreMateriaInsc && 
             nombreMateriaInsc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
             materiaNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    });

    if (!materiaEncontrada) {
      // Búsqueda parcial
      const materiaParcial = inscripciones.find(insc => {
        const nombreMateriaInsc = insc.paralelo?.materia?.nombre;
        return nombreMateriaInsc && 
               nombreMateriaInsc.toLowerCase().includes(materiaNombre.toLowerCase());
      });

      if (!materiaParcial) {
        return this.formatResponse(`❌ Materia no encontrada\n\nNo se encontró "${materiaNombre}" en tus materias inscritas.\n\n📖 Tus materias disponibles:\n${inscripciones.map(insc => `• ${insc.paralelo?.materia?.nombre || 'Materia'}`).join('\n')}`);
      }
      
      return this.generateQueryResponse(materiaParcial, queryType);
    }

    return this.generateQueryResponse(materiaEncontrada, queryType);
  }

  private generateQueryResponse(inscripcion: any, queryType: string): string {
    const materia = inscripcion.paralelo?.materia;
    const calificacion = inscripcion.calificacion;
    const aula = inscripcion.paralelo?.aula || 'No asignada';
    const paralelo = inscripcion.paralelo?.numero_paralelo || 'N/A';
    const carrera = inscripcion.carrera?.nombre || 'No disponible';

    switch (queryType) {
      case 'aula':
        return this.formatResponse(`🏫 Información de Aula\n\n📚 ${materia?.nombre || 'Materia'}\n\n📍 Aula: ${aula}\n🔢 Paralelo: ${paralelo}\n🎓 Carrera: ${carrera}\n\n💡 Recuerda llegar puntual a tu clase.`);

      case 'paralelo':
        return this.formatResponse(`🔢 Información de Paralelo\n\n📚 ${materia?.nombre || 'Materia'}\n\n🔢 Paralelo: ${paralelo}\n📍 Aula: ${aula}\n🎓 Carrera: ${carrera}\n\n📝 Este es tu grupo de estudio para esta materia.`);

      case 'calificacion':
        if (calificacion === null || calificacion === undefined) {
          return this.formatResponse(`📚 ${materia?.nombre || 'Materia'}\n\n📝 Estado: Pendiente de calificación\n🏫 Aula: ${aula}\n🔢 Paralelo: ${paralelo}\n🎓 Carrera: ${carrera}\n\nTu profesor aún no ha publicado la calificación para esta materia.`);
        } else {
          let estadoEmoji = '✅';
          let estadoTexto = 'Aprobado';
          let recomendacion = '';

          if (calificacion >= 90) {
            estadoEmoji = '🏆';
            estadoTexto = 'Excelente';
            recomendacion = '¡Excelente trabajo! Sigue manteniendo ese rendimiento sobresaliente.';
          } else if (calificacion >= 80) {
            estadoEmoji = '⭐';
            estadoTexto = 'Muy bueno';
            recomendacion = 'Muy buen rendimiento. Estás cerca de la excelencia.';
          } else if (calificacion >= 70) {
            estadoEmoji = '👍';
            estadoTexto = 'Satisfactorio';
            recomendacion = 'Buen trabajo. Sigue esforzándote para mejorar.';
          } else {
            estadoEmoji = '⚠️';
            estadoTexto = 'Necesita mejora';
            recomendacion = `Esta materia requiere atención. Te recomiendo solicitar tutoría y dedicar más tiempo de estudio.`;
          }

          return this.formatResponse(`📚 ${materia?.nombre || 'Materia'}\n\n${estadoEmoji} ${estadoTexto}\n📊 Calificación: ${calificacion}/100\n🏫 Aula: ${aula}\n🔢 Paralelo: ${paralelo}\n🎓 Carrera: ${carrera}\n\n${recomendacion}`);
        }

      default:
        return this.generateMateriaDetalle(inscripcion);
    }
  }

  private generateMateriaDetalle(inscripcion: any): string {
    const materia = inscripcion.paralelo?.materia;
    const calificacion = inscripcion.calificacion;
    const aula = inscripcion.paralelo?.aula || 'No asignada';
    const paralelo = inscripcion.paralelo?.numero_paralelo || 'N/A';
    const carrera = inscripcion.carrera?.nombre || 'No disponible';

    let response = `📚 ${materia?.nombre || 'Materia'}\n\n`;

    if (calificacion === null || calificacion === undefined) {
      response += `📝 Estado: Pendiente de calificación\n`;
      response += `🏫 Aula: ${aula}\n`;
      response += `🔢 Paralelo: ${paralelo}\n`;
      response += `🎓 Carrera: ${carrera}\n\n`;
      response += `Tu profesor aún no ha publicado la calificación para esta materia.`;
    } else {
      let estadoEmoji = '✅';
      let estadoTexto = 'Aprobado';
      let recomendacion = '';

      if (calificacion >= 90) {
        estadoEmoji = '🏆';
        estadoTexto = 'Excelente';
        recomendacion = '¡Excelente trabajo! Sigue manteniendo ese rendimiento sobresaliente.';
      } else if (calificacion >= 80) {
        estadoEmoji = '⭐';
        estadoTexto = 'Muy bueno';
        recomendacion = 'Muy buen rendimiento. Estás cerca de la excelencia.';
      } else if (calificacion >= 70) {
        estadoEmoji = '👍';
        estadoTexto = 'Satisfactorio';
        recomendacion = 'Buen trabajo. Sigue esforzándote para mejorar.';
      } else {
        estadoEmoji = '⚠️';
        estadoTexto = 'Necesita mejora';
        recomendacion = `Esta materia requiere atención. Te recomiendo solicitar tutoría y dedicar más tiempo de estudio.`;
      }

      response += `${estadoEmoji} ${estadoTexto}\n\n`;
      response += `📊 Calificación: ${calificacion}/100\n`;
      response += `🏫 Aula: ${aula}\n`;
      response += `🔢 Paralelo: ${paralelo}\n`;
      response += `🎓 Carrera: ${carrera}\n\n`;
      response += `${recomendacion}`;
    }

    return this.formatResponse(response);
  }

  // ===== CONSULTA DE DATOS ACADÉMICOS =====

  private async fetchUserData(token: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mis-inscripciones/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        return [];
      }
      
      return data;
      
    } catch (error) {
      throw error;
    }
  }

  private async fetchSyllabusData(token: string): Promise<any[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/silabo/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return [];
      }

      return data;

    } catch (error) {
      throw error;
    }
  }

  private async getSyllabusDataForUser(inscripciones: any[], token: string): Promise<MateriaSyllabus[]> {
    const rawData = await this.fetchSyllabusData(token);
    const materiaMap = new Map<string, MateriaSyllabus>();

    for (const inscripcion of inscripciones) {
      const materiaNombre = inscripcion.paralelo?.materia?.nombre;
      if (!materiaNombre) {
        continue;
      }

      const normalizedMateria = this.normalizeText(materiaNombre);
      const matchingSilabos = rawData.filter((item: any) => {
        const itemMateria = item.materia?.nombre || item.id_Materia?.nombre || '';
        if (!itemMateria) {
          return false;
        }

        if (!this.areStringsEquivalent(itemMateria, materiaNombre)) {
          return false;
        }

        const paraleloId = inscripcion.paralelo?.id_Paralelo;
        if (paraleloId && item.paralelo?.id_Paralelo) {
          return item.paralelo.id_Paralelo === paraleloId;
        }

        return true;
      });

      if (matchingSilabos.length === 0) {
        continue;
      }

      if (!materiaMap.has(normalizedMateria)) {
        materiaMap.set(normalizedMateria, {
          materiaNombre,
          paraleloId: inscripcion.paralelo?.id_Paralelo ?? null,
          temas: [],
        });
      }

      const materiaSyllabus = materiaMap.get(normalizedMateria)!;

      for (const silabo of matchingSilabos) {
        if (!Array.isArray(silabo.temas)) {
          continue;
        }

        for (const tema of silabo.temas) {
          if (!tema?.titulo) {
            continue;
          }

          const subtemas = Array.isArray(tema.subtemas) ? tema.subtemas.map((sub: any) => ({
            id: sub?.id ?? null,
            titulo: sub?.titulo || '',
            descripcion: sub?.descripcion || null,
            recursos: sub?.recursos || null,
            orden: sub?.orden ?? null,
          })) : [];

          const existingTema = materiaSyllabus.temas.find(item => this.areStringsEquivalent(item.titulo, tema.titulo));

          if (existingTema) {
            if (!existingTema.descripcion && tema.descripcion) {
              existingTema.descripcion = tema.descripcion;
            }
            subtemas.forEach(subtopic => {
              if (!existingTema.subtemas.some(existingSub => this.areStringsEquivalent(existingSub.titulo, subtopic.titulo))) {
                existingTema.subtemas.push(subtopic);
              }
            });
          } else {
            materiaSyllabus.temas.push({
              id: tema.id ?? null,
              titulo: tema.titulo,
              descripcion: tema.descripcion || null,
              semana: tema.semana ?? null,
              orden: tema.orden ?? null,
              subtemas,
            });
          }
        }
      }
    }

    return Array.from(materiaMap.values());
  }

  private generateAcademicResponse(
    inscripciones: any[],
    message: string,
    options?: AcademicResponseOptions
  ): string {
    if (!inscripciones || inscripciones.length === 0) {
      return this.formatResponse('Informacion Academica\n\nNo se encontraron materias inscritas para tu usuario.\n\nPor favor verifica:\n- Que estes correctamente inscrito en el periodo actual\n- O contacta con la administracion academica');
    }

    const syllabusData = options?.syllabusData || null;

    if (this.conversationContext.pendingTopicSelection) {
      const topicResponse = this.tryHandleTopicSelection(message);
      if (topicResponse) {
        return topicResponse;
      }
    }

    const specificQuery = this.detectSpecificQuery(message, inscripciones);
    if (specificQuery.type !== 'none' && specificQuery.materiaNombre) {
      return this.generateSpecificResponse(inscripciones, specificQuery.materiaNombre, specificQuery.query || 'general');
    }

    const isSyllabusQuery = this.isSyllabusQuery(message);
    const isGradeQuery = this.isGradeRelated(message);
    const isAverageQuery = this.isAverageQuery(message);
    const isSubjectQuery = this.isSubjectRelated(message);
    const isClassroomQuery = this.isClassroomRelated(message);
    const isParaleloQuery = this.isParaleloRelated(message);
    const isBestGrade = this.isBestGradeQuery(message);
    const isWorstGrade = this.isWorstGradeQuery(message);
    const isRoadmap = this.isRoadmapQuery(message);
    const isImprovement = this.isImprovementQuery(message);

    this.updateConversationContext(message, inscripciones);

    if (isSyllabusQuery) {
      if (!syllabusData || syllabusData.length === 0) {
        if (options?.requestedSyllabus) {
          return this.formatResponse('No pude acceder al silabo de tus materias. Verifica tu conexion o intenta mas tarde.');
        }
        return this.formatResponse('Aun no tengo informacion del silabo asociada a tus materias.');
      }
      return this.generateSyllabusOverview(inscripciones, message, syllabusData);
    } else if (isAverageQuery) {
      return this.generateAverageResponse(inscripciones);
    } else if (isBestGrade) {
      return this.generateBestGradeResponse(inscripciones);
    } else if (isWorstGrade) {
      return this.generateWorstGradeResponse(inscripciones);
    } else if (isRoadmap || isImprovement) {
      return this.generateRoadmapResponse(inscripciones, syllabusData);
    } else if (isGradeQuery) {
      return this.generateGradeResponse(inscripciones);
    } else if (isSubjectQuery) {
      return this.generateSubjectResponse(inscripciones);
    } else if (isClassroomQuery || isParaleloQuery) {
      return this.generateClassroomResponse(inscripciones);
    } else {
      return this.generateGeneralResponse(inscripciones);
    }
  }

  // ===== NUEVA FUNCIÓN: PROMEDIO SOLAMENTE =====
  private generateAverageResponse(inscripciones: any[]): string {
    const inscripcionesConNota = inscripciones.filter(insc => 
      insc.calificacion !== null && insc.calificacion !== undefined
    );
    
    if (inscripcionesConNota.length === 0) {
      return this.formatResponse('📊 Promedio General\n\nAún no tienes calificaciones registradas para calcular tu promedio.\n\nLas calificaciones serán publicadas por tus profesores.');
    }

    const promedio = inscripcionesConNota.reduce((acc: number, insc: any) => 
      acc + insc.calificacion, 0) / inscripcionesConNota.length;

    let estadoEmoji = '📊';
    let estadoTexto = '';

    if (promedio >= 90) {
      estadoEmoji = '🏆';
      estadoTexto = '¡Excelente! Tu promedio es sobresaliente.';
    } else if (promedio >= 80) {
      estadoEmoji = '⭐';
      estadoTexto = '¡Muy bien! Tu promedio es muy bueno.';
    } else if (promedio >= 70) {
      estadoEmoji = '✅';
      estadoTexto = 'Buen trabajo. Tu promedio es satisfactorio.';
    } else {
      estadoEmoji = '📈';
      estadoTexto = 'Hay oportunidad de mejora. Te recomiendo revisar tus estrategias de estudio.';
    }

    return this.formatResponse(`${estadoEmoji} Promedio General\n\n📊 ${promedio.toFixed(2)}/100\n\n${estadoTexto}`);
  }

  // ===== FUNCIONES PARA MEJOR/PEOR CALIFICACIÓN =====

  private generateBestGradeResponse(inscripciones: any[]): string {
    const inscripcionesConNota = inscripciones.filter(insc => 
      insc.calificacion !== null && insc.calificacion !== undefined
    );
    
    if (inscripcionesConNota.length === 0) {
      return this.formatResponse('📝 Estado de Calificaciones\n\nAún no tienes calificaciones registradas.\n\nLas calificaciones serán publicadas por tus profesores.');
    }

    const mejorInscripcion = inscripcionesConNota.reduce((max, insc) => 
      insc.calificacion > max.calificacion ? insc : max
    );

    const materia = mejorInscripcion.paralelo?.materia;
    const calificacion = mejorInscripcion.calificacion;

    let estadoEmoji = '🎉';
    let estadoTexto = 'Excelente';
    if (calificacion >= 90) {
      estadoEmoji = '🏆';
      estadoTexto = 'Sobresaliente';
    } else if (calificacion >= 80) {
      estadoEmoji = '⭐';
      estadoTexto = 'Muy bueno';
    }

    return this.formatResponse(`${estadoEmoji} Tu Mejor Calificación\n\n${materia?.nombre || 'Materia no disponible'}\n\nCalificación: ${calificacion}/100\nCarrera: ${mejorInscripcion.carrera?.nombre || 'No disponible'}\nAula: ${mejorInscripcion.paralelo?.aula || 'No disponible'}\nParalelo: ${mejorInscripcion.paralelo?.numero_paralelo || 'N/A'}\n\n${estadoTexto}! Sigue manteniendo ese excelente rendimiento en esta materia. Es un gran ejemplo para tus demás asignaturas.`);
  }

  private generateWorstGradeResponse(inscripciones: any[]): string {
    console.log('🔍 Generando respuesta para peor nota...', inscripciones);
    
    const inscripcionesConNota = inscripciones.filter(insc => 
      insc.calificacion !== null && insc.calificacion !== undefined && 
      typeof insc.calificacion === 'number' && !isNaN(insc.calificacion)
    );
    
    if (inscripcionesConNota.length === 0) {
      return this.formatResponse('📝 Estado de Calificaciones\n\nAún no tienes calificaciones registradas.');
    }

    console.log('📊 Inscripciones con nota válida:', inscripcionesConNota.length);

    // Encontrar la peor calificación
    const peorInscripcion = inscripcionesConNota.reduce((min, insc) => {
      console.log(`Comparando: ${insc.calificacion} vs ${min.calificacion}`);
      return insc.calificacion < min.calificacion ? insc : min;
    });

    const materia = peorInscripcion.paralelo?.materia;
    const calificacion = peorInscripcion.calificacion;

    console.log('🎯 Peor calificación encontrada:', { materia: materia?.nombre, calificacion });

    let response = '';
    
    if (calificacion < 70) {
      response = `⚠️ Materia que Requiere Atención Inmediata\n\n`;
      response += `📚 **${materia?.nombre || 'Materia no disponible'}**\n\n`;
      response += `🔢 Calificación actual: **${calificacion}/100**\n`;
      response += `🏫 Carrera: ${peorInscripcion.carrera?.nombre || 'No disponible'}\n`;
      response += `🏢 Aula: ${peorInscripcion.paralelo?.aula || 'No disponible'}\n\n`;
      response += `🚨 Esta materia necesita atención prioritaria. Te recomiendo:\n\n`;
      response += `💡 **Estrategias Inmediatas:**\n`;
      response += `• Solicita tutoría con tu profesor\n`;
      response += `• Revisa los temas que no comprendiste\n`;
      response += `• Forma un grupo de estudio\n`;
      response += `• Dedica tiempo adicional diario a esta materia\n`;
      response += `• Consulta recursos adicionales en línea\n\n`;
      
      // Agregar enlaces de estudio
      response += generateStudyLinks(materia?.nombre || '');
      
      response += `\n🤔 ¿Te gustaría que genere un roadmap detallado para mejorar en **${materia?.nombre || 'esta materia'}**?`;
    } else {
      response = `📊 Materia con Menor Calificación\n\n`;
      response += `📚 **${materia?.nombre || 'Materia no disponible'}**\n\n`;
      response += `🔢 Calificación: **${calificacion}/100**\n\n`;
      response += `✅ Aunque esta es tu calificación más baja, está dentro del rango aprobatorio. `;
      response += `Aún así, hay oportunidad de mejorar para alcanzar la excelencia.\n\n`;
      response += `💡 **Consejos para mejorar:**\n`;
      response += `• Revisa los temas donde perdiste puntos\n`;
      response += `• Practica ejercicios adicionales\n`;
      response += `• Participa más activamente en clase\n`;
      response += `• Busca material complementario\n\n`;
      
      // Agregar enlaces de estudio
      response += generateStudyLinks(materia?.nombre || '');
    }

    return this.formatResponse(response);
  }
  // ===== ROADMAP MEJORADO - SE ACTIVA AUTOMÁTICAMENTE =====

  private generateRoadmapResponse(inscripciones: any[], syllabusData?: MateriaSyllabus[] | null): string {
    const materiasBajas = inscripciones.filter(insc => 
      insc.calificacion !== null && insc.calificacion < 70
    );

    if (materiasBajas.length === 0) {
      // Si no hay materias bajas pero el usuario pide mejorar, dar consejos generales
      return this.formatResponse('🎉 ¡Excelente noticia!\n\nNo tienes materias con calificaciones insuficientes. Todas tus notas están en el rango aprobatorio.\n\n💡 Para seguir mejorando:\n\n1. **Mantén tu ritmo** - Sigue con tus buenos hábitos de estudio\n2. **Profundiza conocimientos** - Explora temas avanzados de tus materias\n3. **Participa activamente** - Contribuye en clase y grupos de estudio\n4. **Busca desafíos** - Considera proyectos extracurriculares\n\n¡Sigue así! 🚀');
    }

    let response = '🎯 Plan de Mejora Académica\n\n';
    response += `He identificado ${materiasBajas.length} materia(s) que necesitan atención especial:\n\n`;

    materiasBajas.forEach((inscripcion: any, index: number) => {
      const materia = inscripcion.paralelo?.materia;
      const calificacion = inscripcion.calificacion;

      response += `${index + 1}. **${materia?.nombre || 'Materia'}**\n`;
      response += `   Calificación actual: ${calificacion}/100\n\n`;
      response += this.generateSubjectRoadmap(materia?.nombre || 'esta materia', calificacion);
      response += '\n---\n\n';
    });
    


    response += '💪 **Consejos Generales para el Éxito:**\n\n';
    response += '1. **Organización del Tiempo**\n';
    // ⭐ AGREGAR ESTA LÍNEA:
    response += generateStudyLinks('estudio general');
    response += '   • Crea un horario de estudio diario\n';
    response += '   • Prioriza las materias más difíciles\n';
    response += '   • Estudia en bloques de 45-50 minutos\n\n';
    
    response += '2. **Técnicas de Estudio Efectivas**\n';
    response += '   • Resúmenes y mapas conceptuales\n';
    response += '   • Técnica Pomodoro (25min estudio / 5min descanso)\n';
    response += '   • Práctica con ejercicios\n';
    response += '   • Enseña lo aprendido a otros\n\n';
    
    response += '3. **Apoyo Académico**\n';
    response += '   • Asiste a tutorías regularmente\n';
    response += '   • Forma grupos de estudio\n';
    response += '   • Consulta recursos en línea\n';
    response += '   • Comunícate con tus profesores\n\n';
    
    response += '📈 **Recuerda**: La mejora es un proceso gradual. Establece metas pequeñas y celebra cada logro.';

    const materiasConTemas: MateriaSyllabus[] = [];
    if (syllabusData && syllabusData.length > 0) {
      materiasBajas.forEach((inscripcion: any) => {
        const materiaNombre = inscripcion.paralelo?.materia?.nombre;
        if (!materiaNombre) {
          return;
        }
        const match = syllabusData.find(item => this.areStringsEquivalent(item.materiaNombre, materiaNombre));
        if (match && match.temas.length > 0 && !materiasConTemas.some(existing => this.areStringsEquivalent(existing.materiaNombre, match.materiaNombre))) {
          materiasConTemas.push(match);
        }
      });
    }

    if (materiasConTemas.length > 0) {
      const selection = this.prepareTopicSelection(materiasConTemas, 'roadmap');
      if (selection) {
        this.conversationContext.pendingTopicSelection = selection.state;
        this.conversationContext.pendingAction = 'topic_detail';
        response += '\n' + selection.message;
      }
    } else if (this.conversationContext.pendingTopicSelection?.source === 'roadmap') {
      this.conversationContext.pendingTopicSelection = null;
    }

    return this.formatResponse(response);
  }

  private generateSubjectRoadmap(materia: string, calificacion: number): string {
    const puntosAMejorar = 70 - calificacion;
    const semanas = Math.ceil(puntosAMejorar / 5);

    let roadmap = `   📋 **Roadmap de Mejora para ${materia}:**\n\n`;
    roadmap += `   **Objetivo**: Alcanzar 70+ puntos\n`;
    roadmap += `   **Puntos necesarios**: ${puntosAMejorar.toFixed(0)}\n`;
    roadmap += `   **Tiempo estimado**: ${semanas} semanas\n\n`;

    roadmap += `   **Semana 1-2: Fundamentos**\n`;
    roadmap += `   • Revisa el material básico del curso\n`;
    roadmap += `   • Identifica tus puntos débiles\n`;
    roadmap += `   • Resuelve ejercicios básicos\n`;
    roadmap += `   • Asiste a tutorías\n\n`;

    roadmap += `   **Semana 3-4: Práctica Intensiva**\n`;
    roadmap += `   • Practica ejercicios intermedios\n`;
    roadmap += `   • Estudia con compañeros\n`;
    roadmap += `   • Consulta material complementario\n`;
    roadmap += `   • Realiza autoevaluaciones\n\n`;

    if (semanas > 4) {
      roadmap += `   **Semana 5+: Consolidación**\n`;
      roadmap += `   • Resuelve problemas avanzados\n`;
      roadmap += `   • Repasa todos los temas\n`;
      roadmap += `   • Simula exámenes\n`;
      roadmap += `   • Refuerza áreas débiles\n\n`;
    }

    roadmap += `   📚 **Recursos Recomendados:**\n`;
    roadmap += `   • Khan Academy (videos educativos)\n`;
    roadmap += `   • Coursera (cursos complementarios)\n`;
    roadmap += `   • YouTube (tutoriales específicos)\n`;
    roadmap += `   • Biblioteca universitaria\n`;
    roadmap += `   • Material del profesor\n`;

    return roadmap;
  }

  // ===== SISTEMA DE CONTEXTO DE CONVERSACIÓN =====

  private prepareTopicSelection(
    materias: MateriaSyllabus[],
    source: 'roadmap' | 'syllabus'
  ): TopicSelectionPreparation | null {
    const options: TopicSelectionOption[] = [];
    const lines: string[] = [];
    let counter = 1;

    materias.forEach(materia => {
      if (!materia || materia.temas.length === 0) {
        return;
      }

      lines.push(`${materia.materiaNombre}:`);
      materia.temas.forEach(tema => {
        if (!tema?.titulo) {
          return;
        }

        const optionId = counter.toString();
        const subtemas = tema.subtemas.map(subtema => ({
          id: subtema.id ?? null,
          titulo: subtema.titulo,
          descripcion: subtema.descripcion || null,
        }));

        lines.push(`  ${optionId}. ${tema.titulo}`);
        if (subtemas.length > 0) {
          lines.push(`     Subtemas: ${subtemas.map(item => item.titulo).join(', ')}`);
        }

        options.push({
          id: optionId,
          materia: materia.materiaNombre,
          tema: tema.titulo,
          temaDescripcion: tema.descripcion || null,
          subtemas,
        });

        counter += 1;
      });
      lines.push('');
    });

    if (options.length === 0) {
      return null;
    }

    lines.push('Indica el numero o el nombre del tema/subtema que deseas repasar.');

    const prompt = lines.join('\n').trim();

    return {
      state: {
        options,
        source,
        prompt,
      },
      message: this.formatResponse(prompt),
    };
  }

  private createOptionFromTema(materiaNombre: string, tema: SyllabusTema): TopicSelectionOption {
    return {
      id: '0',
      materia: materiaNombre,
      tema: tema.titulo,
      temaDescripcion: tema.descripcion || null,
      subtemas: tema.subtemas.map(subtema => ({
        id: subtema.id ?? null,
        titulo: subtema.titulo,
        descripcion: subtema.descripcion || null,
      })),
    };
  }

  private tryHandleTopicSelection(message: string): string | null {
    const state = this.conversationContext.pendingTopicSelection;
    if (!state || state.options.length === 0) {
      return null;
    }

    const normalizedMessage = this.normalizeText(message);
    const numberMatch = normalizedMessage.match(/(\d{1,2})/);

    let selectedOption: TopicSelectionOption | undefined;
    let selectedSubtopic: TopicSelectionSubtopic | undefined;

    if (numberMatch) {
      selectedOption = state.options.find(option => option.id === numberMatch[1]);
    }

    if (!selectedOption) {
      for (const option of state.options) {
        if (normalizedMessage.includes(this.normalizeText(option.tema))) {
          selectedOption = option;
          break;
        }

        for (const subtopic of option.subtemas) {
          if (normalizedMessage.includes(this.normalizeText(subtopic.titulo))) {
            selectedOption = option;
            selectedSubtopic = subtopic;
            break;
          }
        }

        if (selectedOption) {
          break;
        }
      }
    }

    if (!selectedOption) {
      const keywords = ['tema', 'subtema', 'opcion', 'numero', 'repasar', 'contenido'];
      const hasKeyword = keywords.some(keyword => normalizedMessage.includes(keyword));
      if (hasKeyword) {
        return this.formatResponse(`${state.prompt}

Recuerda indicarme el numero o el nombre del tema o subtema.`);
      }
      return null;
    }

    return this.formatTopicDetailResponse(selectedOption, selectedSubtopic?.titulo);
  }

  private generateSyllabusOverview(
    inscripciones: any[],
    message: string,
    syllabusData: MateriaSyllabus[]
  ): string {
    if (!syllabusData || syllabusData.length === 0) {
      return this.formatResponse('No encontre informacion del silabo para tus materias registradas.');
    }

    const materiaReferencia = this.findMateriaFromMessage(message, inscripciones);
    const normalizedMessage = this.normalizeText(message);

    let materiasObjetivo: MateriaSyllabus[] = [];
    if (materiaReferencia) {
      materiasObjetivo = syllabusData.filter(item => this.areStringsEquivalent(item.materiaNombre, materiaReferencia));
    }

    if (materiasObjetivo.length === 0 && syllabusData.length === 1) {
      materiasObjetivo = [syllabusData[0]];
    }

    if (materiasObjetivo.length === 1) {
      const materia = materiasObjetivo[0];

      for (const tema of materia.temas) {
        if (normalizedMessage.includes(this.normalizeText(tema.titulo))) {
          return this.formatTopicDetailResponse(this.createOptionFromTema(materia.materiaNombre, tema));
        }

        for (const subtema of tema.subtemas) {
          if (normalizedMessage.includes(this.normalizeText(subtema.titulo))) {
            return this.formatTopicDetailResponse(this.createOptionFromTema(materia.materiaNombre, tema), subtema.titulo);
          }
        }
      }

      const selection = this.prepareTopicSelection([materia], 'syllabus');
      if (selection) {
        this.conversationContext.pendingTopicSelection = selection.state;
        this.conversationContext.pendingAction = 'topic_detail';
        this.conversationContext.lastMentionedMateria = materia.materiaNombre;
        return selection.message;
      }
    }

    const selection = this.prepareTopicSelection(materiasObjetivo.length > 0 ? materiasObjetivo : syllabusData, 'syllabus');
    if (selection) {
      this.conversationContext.pendingTopicSelection = selection.state;
      this.conversationContext.pendingAction = 'topic_detail';
      return selection.message;
    }

    return this.formatResponse('No encontre temas listados en el silabo de tus materias.');
  }

  private formatTopicDetailResponse(option: TopicSelectionOption, subtopicTitle?: string): string {
    const materiaName = option.materia;

    if (subtopicTitle) {
      const detail = getSubtopicStudyGuide(materiaName, option.tema, subtopicTitle);
      if (detail) {
        const message = formatStudyGuideResponse({ materia: materiaName, topic: detail.topic, subtopic: detail.subtopic });
        return this.formatResponse(`${message}

Si deseas repasar otro tema, dime el numero o el nombre.`);
      }
    }

    const topicGuide = getTopicStudyGuide(materiaName, option.tema);
    if (topicGuide) {
      let message = formatStudyGuideResponse({ materia: materiaName, topic: topicGuide });

      if (subtopicTitle) {
        const fallbackSubtopic = option.subtemas.find(item => this.areStringsEquivalent(item.titulo, subtopicTitle));
        if (fallbackSubtopic) {
          message += `

Subtema destacado: ${fallbackSubtopic.titulo}${fallbackSubtopic.descripcion ? ` - ${fallbackSubtopic.descripcion}` : ''}`;
        }
      }

      return this.formatResponse(`${message}

Si deseas repasar otro tema, dime el numero o el nombre.`);
    }

    const fallbackLines: string[] = [];
    fallbackLines.push(`${materiaName} - ${option.tema}`);
    if (option.temaDescripcion) {
      fallbackLines.push(`Resumen: ${option.temaDescripcion}`);
    }
    if (option.subtemas.length > 0) {
      fallbackLines.push('');
      fallbackLines.push('Subtemas disponibles:');
      option.subtemas.forEach(item => {
        if (item.descripcion) {
          fallbackLines.push(`- ${item.titulo}: ${item.descripcion}`);
        } else {
          fallbackLines.push(`- ${item.titulo}`);
        }
      });
    }
    fallbackLines.push('');
    fallbackLines.push(generateStudyLinks(subtopicTitle || option.tema, materiaName));
    fallbackLines.push('');
    fallbackLines.push('Si deseas repasar otro tema, dime el numero o el nombre.');

    return this.formatResponse(fallbackLines.join('\n'));
  }

  private updateConversationContext(message: string, inscripciones: any[]): void {
    const lowerMessage = message.toLowerCase();
    
    // Detectar materia mencionada
    for (const inscripcion of inscripciones) {
      const materiaNombre = inscripcion.paralelo?.materia?.nombre;
      if (materiaNombre && lowerMessage.includes(materiaNombre.toLowerCase())) {
        this.conversationContext.lastMentionedMateria = materiaNombre;
        break;
      }
    }

    // Detectar tipo de consulta
    if (this.isGradeRelated(lowerMessage)) {
      this.conversationContext.lastQueryType = 'calificaciones';
    } else if (this.isSubjectRelated(lowerMessage)) {
      this.conversationContext.lastQueryType = 'materias';
    } else if (this.isRoadmapQuery(lowerMessage)) {
      this.conversationContext.lastQueryType = 'mejora';
    }

    // Detectar acciones pendientes
    if (lowerMessage.includes('mejorar') || lowerMessage.includes('ayuda') || lowerMessage.includes('consejo')) {
      this.conversationContext.pendingAction = 'roadmap';
    }
  }

  // ===== FUNCIONES DE GENERACIÓN DE RESPUESTAS MEJORADAS =====

  private generateGradeResponse(inscripciones: any[]): string {
    let response = '📊 Tus Calificaciones\n\n';
    
    const inscripcionesConNota = inscripciones.filter(insc => 
      insc.calificacion !== null && insc.calificacion !== undefined
    );
    
    if (inscripcionesConNota.length === 0) {
      return this.formatResponse(`📝 Estado de Calificaciones\n\nTodas tus materias están pendientes de calificación.\n\nMaterias inscritas:\n${inscripciones.map(insc => {
        const materia = insc.paralelo?.materia;
        return `• ${materia?.nombre || 'Materia'}`;
      }).join('\n')}\n\nLas calificaciones serán publicadas por tus profesores.`);
    }
    
    inscripcionesConNota.forEach((inscripcion: any) => {
      const calificacion = inscripcion.calificacion;
      const estado = calificacion >= 70 ? '✅' : '⚠️';
      const materia = inscripcion.paralelo?.materia;
      
      response += `${estado} ${materia?.nombre || 'Materia no disponible'}\n`;
      response += `   Calificación: ${calificacion}/100\n`;
      response += `   Carrera: ${inscripcion.carrera?.nombre || 'No disponible'}\n`;
      response += `   Aula: ${inscripcion.paralelo?.aula || 'No disponible'}\n`;
      response += `   Paralelo: ${inscripcion.paralelo?.numero_paralelo || 'N/A'}\n\n`;
    });
    
    const promedio = inscripcionesConNota.reduce((acc: number, insc: any) => 
      acc + insc.calificacion, 0) / inscripcionesConNota.length;
    const estadoPromedio = promedio >= 70 ? '🎉' : '📈';
    
    response += `${estadoPromedio} Promedio General: ${promedio.toFixed(2)}/100\n\n`;
    
    // Identificar materias que necesitan atención
    const materiasBajas = inscripcionesConNota.filter(insc => insc.calificacion < 70);
    
    if (materiasBajas.length > 0) {
      response += `⚠️ Materias que requieren atención: ${materiasBajas.length}\n\n`;
      materiasBajas.forEach(insc => {
        const materia = insc.paralelo?.materia;
        response += `• ${materia?.nombre || 'Materia'}: ${insc.calificacion}/100\n`;
      });
      response += `\n¿Te gustaría que genere un plan de mejora personalizado?`;
    } else if (promedio >= 90) {
      response += `¡Excelente trabajo! 🏆 Mantén ese rendimiento excepcional.`;
    } else if (promedio >= 80) {
      response += `¡Muy buen rendimiento! ⭐ Estás en camino a la excelencia.`;
    } else if (promedio >= 70) {
      response += `Buen rendimiento 👍 Sigue esforzándote para alcanzar la excelencia.`;
    }
    
    return this.formatResponse(response);
  }

  private generateSubjectResponse(inscripciones: any[]): string {
    let response = '📖 Tus Materias Inscritas\n\n';
    
    inscripciones.forEach((inscripcion: any) => {
      const materia = inscripcion.paralelo?.materia;
      const calificacion = inscripcion.calificacion !== null && inscripcion.calificacion !== undefined 
        ? `${inscripcion.calificacion}/100` 
        : 'Sin calificar';
      
      response += `• ${materia?.nombre || 'Materia no disponible'}\n`;
      response += `   Aula: ${inscripcion.paralelo?.aula || 'N/A'}\n`;
      response += `   Paralelo: ${inscripcion.paralelo?.numero_paralelo || 'N/A'}\n`;
      response += `   Calificación: ${calificacion}\n`;
      response += `   Carrera: ${inscripcion.carrera?.nombre || 'N/A'}\n\n`;
    });
    
    response += `📈 Total de materias: ${inscripciones.length}`;
    
    return this.formatResponse(response);
  }

  private generateClassroomResponse(inscripciones: any[]): string {
    let response = '🏫 Tus Aulas y Horarios\n\n';
    
    inscripciones.forEach((inscripcion: any) => {
      const materia = inscripcion.paralelo?.materia;
      const calificacion = inscripcion.calificacion !== null && inscripcion.calificacion !== undefined 
        ? `${inscripcion.calificacion}/100` 
        : 'Pendiente';
      
      response += `📚 ${materia?.nombre || 'Materia no disponible'}\n`;
      response += `   Aula: ${inscripcion.paralelo?.aula || 'No asignada'}\n`;
      response += `   Paralelo: ${inscripcion.paralelo?.numero_paralelo || 'N/A'}\n`;
      response += `   Carrera: ${inscripcion.carrera?.nombre || 'No disponible'}\n`;
      response += `   Calificación actual: ${calificacion}\n\n`;
    });
    
    return this.formatResponse(response);
  }

  private generateGeneralResponse(inscripciones: any[]): string {
    let response = '🎓 Tu Información Académica Completa\n\n';
    
    const carrerasMap = new Map<string, any[]>();
    inscripciones.forEach(inscripcion => {
      const carreraNombre = inscripcion.carrera?.nombre || 'Sin carrera';
      if (!carrerasMap.has(carreraNombre)) {
        carrerasMap.set(carreraNombre, []);
      }
      carrerasMap.get(carreraNombre)!.push(inscripcion);
    });
    
    carrerasMap.forEach((materias, carrera) => {
      response += `🎓 ${carrera}\n\n`;
      
      materias.forEach((inscripcion: any) => {
        const materia = inscripcion.paralelo?.materia;
        const nota = inscripcion.calificacion !== null && inscripcion.calificacion !== undefined 
          ? inscripcion.calificacion 
          : 'N/A';
        const aula = inscripcion.paralelo?.aula || 'N/A';
        
        response += `  • ${materia?.nombre || 'Materia'} - Aula: ${aula} - Nota: ${nota}/100\n`;
      });
      response += '\n';
    });
    
    const conNota = inscripciones.filter(i => i.calificacion !== null && i.calificacion !== undefined);
    const promedio = conNota.length > 0 
      ? (conNota.reduce((acc, i) => acc + i.calificacion, 0) / conNota.length).toFixed(2)
      : 'N/A';
    
    response += `📊 Resumen:\n`;
    response += `• Total de materias: ${inscripciones.length}\n`;
    response += `• Materias calificadas: ${conNota.length}\n`;
    response += `• Promedio general: ${promedio}/100\n`;
    
    return this.formatResponse(response);
  }

  // ===== FUNCIÓN PARA FORMATEAR RESPUESTAS =====

  private formatResponse(text: string): string {
    return text;
  }

  // ===== MÉTODOS PARA MULTIMEDIA MEJORADOS =====

  private async generateImageHash(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        let hash = file.size.toString();
        for (let i = 0; i < Math.min(100, uint8Array.length); i++) {
          hash += uint8Array[i].toString(16);
        }
        resolve(hash);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  async sendMessageWithImage(
    message: string, 
    imageFile: File, 
    userContext?: UserContext
  ): Promise<string> {
    if (this.useFallback || !this.openai) {
      return "El servicio de IA no está disponible. Por favor configura correctamente la API Key de OpenAI.";
    }

    try {
      const imageHash = await this.generateImageHash(imageFile);
      
      if (this.lastImageHash === imageHash && !message) {
        return "Parece que estás enviando la misma imagen. ¿Te gustaría hacer una pregunta específica sobre esta imagen?";
      }
      
      this.lastImageHash = imageHash;

      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: message || "Analiza esta imagen y descríbeme qué ves." },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const assistantResponse = response.choices[0]?.message?.content || "No se pudo analizar la imagen";

      this.chatHistory.push({ 
        role: "user", 
        content: `[Imagen: ${message || "Consulta de imagen"}]` 
      });
      this.chatHistory.push({ 
        role: "assistant", 
        content: assistantResponse 
      });

      return assistantResponse;

    } catch (error: any) {
      console.error('Error procesando imagen:', error);
      
      if (error.message?.includes('gpt-4-turbo')) {
        try {
          const base64Image = await this.fileToBase64(imageFile);
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: message || "Analiza esta imagen y descríbeme qué ves." },
                  {
                    type: "image_url",
                    image_url: {
                      url: base64Image,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
          });
          
          const assistantResponse = response.choices[0]?.message?.content || "No se pudo analizar la imagen";
          
          this.chatHistory.push({ 
            role: "user", 
            content: `[Imagen: ${message || "Consulta de imagen"}]` 
          });
          this.chatHistory.push({ 
            role: "assistant", 
            content: assistantResponse 
          });

          return assistantResponse;
        } catch (secondError) {
          return "Lo siento, no pude procesar la imagen. Verifica que tengas acceso a los modelos de visión de OpenAI.";
        }
      }
      
      return "Lo siento, hubo un error al procesar la imagen. Verifica que el archivo sea válido.";
    }
  }

  // ===== PROCESAMIENTO DE AUDIO MEJORADO =====

  async sendMessageWithAudio(
    audioFile: File,
    userContext?: UserContext
  ): Promise<string> {
    try {
      if (audioFile.size > 25 * 1024 * 1024) {
        return "El audio es demasiado largo. Por favor envía audios de máximo 3 minutos.";
      }

      console.log('🎙️ Procesando comando de voz...');
      
      // 1. TRANSCRIPCIÓN DEL AUDIO
      const transcription = await this.transcribeAudioWithWhisper(audioFile);
      
      if (!transcription || transcription.trim().length < 3) {
        return "No pude entender el audio. Por favor:\n• Habla más claro\n• Evita ruidos de fondo\n• Intenta nuevamente";
      }

      console.log('✅ Transcripción:', transcription);

      // 2. ANÁLISIS DE INTENCIÓN DEL MENSAJE DE VOZ
      const voiceIntent = await this.analyzeVoiceIntent(transcription, userContext);
      
      // 3. EJECUTAR ACCIÓN BASADA EN LA INTENCIÓN
      return await this.executeVoiceCommand(voiceIntent, transcription, userContext);
      
    } catch (error: any) {
      console.error('❌ Error procesando comando de voz:', error);
      return this.handleVoiceError(error);
    }
  }

  private async transcribeAudioWithWhisper(audioFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error en transcripción: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';

    } catch (error) {
      console.warn('❌ Whisper falló, usando reconocimiento del navegador...');
      return await this.transcribeAudioBrowser(audioFile);
    }
  }

  private async transcribeAudioBrowser(audioFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-EC';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      const audioUrl = URL.createObjectURL(audioFile);
      const audio = new Audio(audioUrl);
      
      let transcription = '';
      let isTranscribing = false;
      let timeoutId: NodeJS.Timeout;

      timeoutId = setTimeout(() => {
        if (isTranscribing) {
          recognition.stop();
          reject(new Error('Tiempo de transcripción excedido. El audio es demasiado largo.'));
        }
      }, 90000);
      
      recognition.onstart = () => {
        console.log('🎙️ Transcripción iniciada...');
        isTranscribing = true;
        
        audio.volume = 0.01;
        audio.play().catch(err => {
          console.warn('No se pudo reproducir audio:', err);
        });
      };

      recognition.onresult = (event: any) => {
        console.log('📝 Resultado de reconocimiento recibido');
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcription += event.results[i][0].transcript + ' ';
            console.log('Fragmento transcrito:', event.results[i][0].transcript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);
        isTranscribing = false;
        clearTimeout(timeoutId);
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        
        if (event.error === 'no-speech') {
          reject(new Error('No se detectó voz en el audio. Habla más claro.'));
        } else if (event.error === 'audio-capture') {
          reject(new Error('No se pudo capturar el audio. Verifica tu micrófono.'));
        } else if (event.error === 'not-allowed') {
          reject(new Error('Permiso de micrófono denegado. Da permisos al navegador.'));
        } else if (event.error === 'network') {
          reject(new Error('Error de red durante el reconocimiento.'));
        } else {
          reject(new Error(`Error de reconocimiento: ${event.error}`));
        }
      };

      recognition.onend = () => {
        console.log('🏁 Transcripción finalizada');
        isTranscribing = false;
        clearTimeout(timeoutId);
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        
        if (transcription.trim().length > 0) {
          resolve(transcription.trim());
        } else {
          reject(new Error('No se pudo transcribir el audio. Intenta nuevamente.'));
        }
      };

      try {
        console.log('🔊 Iniciando reconocimiento de voz...');
        recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async analyzeVoiceIntent(transcription: string, userContext?: UserContext): Promise<VoiceIntent> {
    if (this.useFallback || !this.openai) {
      return this.basicIntentAnalysis(transcription);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Eres un analizador de intenciones de voz. Analiza la transcripción y determina:
            
POSIBLES COMANDOS:
- CONSULTA_CALIFICACIONES: Cuando pide notas, calificaciones, promedio
- CONSULTA_MATERIAS: Cuando pide materias, asignaturas, cursos
- CONSULTA_AULA: Cuando pide ubicación, aula, salón
- MEJOR_NOTA: Cuando pide su mejor calificación
- PEOR_NOTA: Cuando pide su peor calificación
- PLAN_MEJORA: Cuando pide ayuda, mejora, roadmap, consejos
- CONSULTA_ESPECIFICA: Cuando menciona una materia específica
- SALUDO: Cuando saluda o inicia conversación
- OTRO: Para cualquier otra cosa

Responde SOLO con el tipo de comando en mayúsculas.`
          },
          {
            role: "user",
            content: `Transcripción: "${transcription}"`
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      });

      const intent = response.choices[0]?.message?.content?.trim() || 'OTRO';
      
      return {
        type: intent as VoiceIntentType,
        transcription,
        confidence: 0.9,
        entities: this.extractEntities(transcription)
      };

    } catch (error) {
      console.error('Error analizando intención:', error);
      return this.basicIntentAnalysis(transcription);
    }
  }

  private basicIntentAnalysis(transcription: string): VoiceIntent {
    const lowerTranscription = transcription.toLowerCase();
    
    let intent: VoiceIntentType = 'OTRO';
    
    if (this.isGradeRelated(lowerTranscription)) intent = 'CONSULTA_CALIFICACIONES';
    else if (this.isSubjectRelated(lowerTranscription)) intent = 'CONSULTA_MATERIAS';
    else if (this.isClassroomRelated(lowerTranscription)) intent = 'CONSULTA_AULA';
    else if (this.isBestGradeQuery(lowerTranscription)) intent = 'MEJOR_NOTA';
    else if (this.isWorstGradeQuery(lowerTranscription)) intent = 'PEOR_NOTA';
    else if (this.isRoadmapQuery(lowerTranscription)) intent = 'PLAN_MEJORA';
    else if (/(hola|buenos|buenas|hey|holi)/i.test(lowerTranscription)) intent = 'SALUDO';
    
    return {
      type: intent,
      transcription,
      confidence: 0.7,
      entities: this.extractEntities(transcription)
    };
  }

  private extractEntities(transcription: string): VoiceEntities {
    const entities: VoiceEntities = {
      materias: [],
      acciones: [],
      parametros: []
    };

    // Extraer nombres de materias mencionadas
    const materiasKeywords = ['matemáticas', 'física', 'química', 'programación', 'historia', 'inglés'];
    materiasKeywords.forEach(materia => {
      if (transcription.toLowerCase().includes(materia)) {
        entities.materias.push(materia);
      }
    });

    // Extraer acciones específicas
    if (transcription.toLowerCase().includes('dónde') || transcription.toLowerCase().includes('donde')) {
      entities.acciones.push('ubicacion');
    }
    if (transcription.toLowerCase().includes('cuánto') || transcription.toLowerCase().includes('cuanto')) {
      entities.acciones.push('cantidad');
    }

    return entities;
  }

  private async executeVoiceCommand(
    intent: VoiceIntent, 
    transcription: string, 
    userContext?: UserContext
  ): Promise<string> {
    
    console.log(`🎯 Ejecutando comando de voz: ${intent.type}`);

    switch (intent.type) {
      case 'CONSULTA_CALIFICACIONES':
        return await this.handleGradeQuery(transcription, userContext);
      
      case 'CONSULTA_MATERIAS':
        return await this.handleSubjectQuery(userContext);
      
      case 'CONSULTA_AULA':
        return await this.handleClassroomQuery(transcription, userContext);
      
      case 'MEJOR_NOTA':
        return await this.handleBestGradeQuery(userContext);
      
      case 'PEOR_NOTA':
        return await this.handleWorstGradeQuery(userContext);
      
      case 'PLAN_MEJORA':
        return await this.handleRoadmapQuery(userContext);
      
      case 'CONSULTA_ESPECIFICA':
        return await this.handleSpecificQuery(transcription, userContext);
      
      case 'SALUDO':
        return this.formatResponse(`¡Hola${userContext?.nombre ? ` ${userContext.nombre}` : ''}! 👋 Te escuché decir: "${transcription}". ¿En qué más puedo ayudarte?`);
      
      default:
        // Para comandos no reconocidos, usar el procesamiento normal
        return await this.sendMessage(transcription, userContext);
    }
  }

  // ===== MANEJADORES ESPECÍFICOS PARA COMANDOS DE VOZ =====

  private async handleGradeQuery(transcription: string, userContext?: UserContext): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return "Necesitas iniciar sesión para consultar tus calificaciones.";
    }

    try {
      const userData = await this.fetchUserData(userContext.token);
      return this.generateGradeResponse(userData);
    } catch (error) {
      return "No pude acceder a tus calificaciones en este momento. Por favor intenta más tarde.";
    }
  }

  private async handleSubjectQuery(userContext?: UserContext): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return "Necesitas iniciar sesión para ver tus materias.";
    }

    try {
      const userData = await this.fetchUserData(userContext.token);
      return this.generateSubjectResponse(userData);
    } catch (error) {
      return "No pude acceder a tu información de materias. Por favor intenta más tarde.";
    }
  }

  private async handleClassroomQuery(transcription: string, userContext?: UserContext): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return "Necesitas iniciar sesión para consultar información de aulas.";
    }

    try {
      const userData = await this.fetchUserData(userContext.token);
      
      // Buscar materia específica en la transcripción
      const specificQuery = this.detectSpecificQuery(transcription, userData);
      if (specificQuery.type !== 'none' && specificQuery.materiaNombre) {
        return this.generateSpecificResponse(userData, specificQuery.materiaNombre, 'aula');
      }
      
      return this.generateClassroomResponse(userData);
    } catch (error) {
      return "No pude acceder a la información de aulas. Por favor intenta más tarde.";
    }
  }

  private async handleBestGradeQuery(userContext?: UserContext): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return "Necesitas iniciar sesión para consultar tu mejor calificación.";
    }

    try {
      const userData = await this.fetchUserData(userContext.token);
      return this.generateBestGradeResponse(userData);
    } catch (error) {
      return "No pude determinar tu mejor calificación en este momento.";
    }
  }

  private async handleWorstGradeQuery(userContext?: UserContext): Promise<string> {
    console.log('🔍 Manejo de consulta de peor nota...', userContext);
    
    if (!userContext?.isLoggedIn || !userContext.token) {
      return "Necesitas iniciar sesión para consultar tu peor calificación.";
    }

    try {
      const userData = await this.fetchUserData(userContext.token);
      console.log('📊 Datos del usuario obtenidos:', userData);
      return this.generateWorstGradeResponse(userData);
    } catch (error) {
      console.error('❌ Error obteniendo datos del usuario:', error);
      return "No pude determinar tu peor calificación en este momento.";
    }
  }

  private async handleRoadmapQuery(userContext?: UserContext): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return "Necesitas iniciar sesion para generar un plan de mejora.";
    }

    try {
      const userData = await this.fetchUserData(userContext.token);
      let syllabusData: MateriaSyllabus[] | null = null;

      try {
        syllabusData = await this.getSyllabusDataForUser(userData, userContext.token);
      } catch (syllabusError) {
        console.error('Error obteniendo silabo para roadmap:', syllabusError);
      }

      return this.generateRoadmapResponse(userData, syllabusData);
    } catch (error) {
      return "No pude generar un plan de mejora en este momento.";
    }
  }

  private async handleSpecificQuery(transcription: string, userContext?: UserContext): Promise<string> {
    if (!userContext?.isLoggedIn || !userContext.token) {
      return "Necesitas iniciar sesion para consultar informacion especifica.";
    }

    try {
      const userData = await this.fetchUserData(userContext.token);
      const wantsSyllabus = this.isSyllabusQuery(transcription);
      let syllabusData: MateriaSyllabus[] | null = null;

      if (wantsSyllabus) {
        try {
          syllabusData = await this.getSyllabusDataForUser(userData, userContext.token);
        } catch (syllabusError) {
          console.error('Error obteniendo silabo para consulta especifica:', syllabusError);
        }
      }

      return this.generateAcademicResponse(userData, transcription, {
        syllabusData,
        requestedSyllabus: wantsSyllabus,
      });
    } catch (error) {
      return "No pude procesar tu consulta especifica en este momento.";
    }
  }

  private handleVoiceError(error: any): string {
    const errorMessage = error.message || 'Error desconocido';
    
    if (errorMessage.includes('permiso') || errorMessage.includes('micrófono')) {
      return "🔊 Error de micrófono:\n\nVerifica que:\n• Tengas permisos de micrófono\n• El micrófono esté funcionando\n• Estés en un entorno tranquilo";
    } else if (errorMessage.includes('tiempo') || errorMessage.includes('largo')) {
      return "⏰ Audio demasiado largo:\n\nPor favor envía audios de 1-3 minutos máximo.";
    } else {
      return `❌ Error procesando audio:\n\n${errorMessage}\n\nIntenta:\n• Hablar más claro\n• Reducir ruido de fondo\n• Enviar audio más corto`;
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

  // ===== MÉTODOS PRINCIPALES =====

  private async getFallbackResponse(message: string, userContext?: UserContext): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('hi')) {
      return this.formatResponse(`¡Hola${userContext?.nombre ? ` ${userContext.nombre}` : ''}! 👋 Soy EduBot, tu asistente educativo.\n\nActualmente estoy en modo de demostración. Para habilitar todas mis funciones inteligentes, configura correctamente la API Key de OpenAI.\n\n¿En qué puedo ayudarte?`);
    }
    
    if (this.isGradeRelated(lowerMessage)) {
      return this.formatResponse(`📊 Consulta de Calificaciones\n\nPara ver tus calificaciones específicas, necesitas:\n1. Iniciar sesión en la plataforma\n2. Configurar correctamente la API Key de OpenAI`);
    }
    
    return this.formatResponse(`🤖 EduBot - Modo Demostración\n\nActualmente estoy funcionando en modo básico.\n\nPara desbloquear todas mis funciones:\n1. Obtén una API Key de OpenAI\n2. Configúrala en .env.local como NEXT_PUBLIC_OPENAI_API_KEY\n\n¿En qué más puedo asistirte?`);
  }

  private initializeChatHistory(userContext?: UserContext): void {
    if (this.chatHistory.length === 0) {
      const systemContext = this.getSystemContext(userContext);
      this.chatHistory = [
        { role: "system", content: systemContext },
        { role: "assistant", content: "¡Hola! Soy EduBot, tu asistente educativo inteligente. ¿En qué puedo ayudarte hoy con tus estudios?" }
      ];
    }
  }

  async sendMessage(message: string, userContext?: UserContext): Promise<string> {
    console.log('🔍 DEBUG sendMessage:', {
      message,
      isLoggedIn: userContext?.isLoggedIn,
      hasToken: !!userContext?.token
    });

    const wantsSyllabusInfo = this.isSyllabusQuery(message) || !!this.conversationContext.pendingTopicSelection;
    if (wantsSyllabusInfo && (!userContext?.isLoggedIn || !userContext.token)) {
      return this.formatResponse('Necesitas iniciar sesion para consultar los temas y subtemas de tu silabo.');
    }

    // Primero verificar si es consulta academica
    if (userContext?.isLoggedIn && userContext.token && 
        (this.isGradeRelated(message) || this.isSubjectRelated(message) || 
         this.isClassroomRelated(message) || this.isParaleloRelated(message) ||
         this.isBestGradeQuery(message) || this.isWorstGradeQuery(message) || 
         this.isRoadmapQuery(message) || this.isImprovementQuery(message) ||
         this.isAverageQuery(message) || this.isSyllabusQuery(message))) {

      try {
        const userData = await this.fetchUserData(userContext.token);

        if (userData && userData.length > 0) {
          const requestedSyllabus = wantsSyllabusInfo || this.isRoadmapQuery(message) || this.isImprovementQuery(message);
          let syllabusData: MateriaSyllabus[] | null = null;

          if (requestedSyllabus) {
            try {
              syllabusData = await this.getSyllabusDataForUser(userData, userContext.token);
            } catch (syllabusError) {
              console.error('Error obteniendo silabo:', syllabusError);
            }
          }

          return this.generateAcademicResponse(userData, message, {
            syllabusData,
            requestedSyllabus,
          });
        }
      } catch (error: any) {
        console.error('�?O Error en API:', error.message);
      }
    }

    if (this.useFallback) {
      return this.getFallbackResponse(message, userContext);
    }

    try {
      this.initializeChatHistory(userContext);

      let finalMessage = message;
      if (userContext?.nombre) {
        finalMessage = `[Usuario: ${userContext.nombre}] ${message}`;
      }

      this.chatHistory.push({ role: "user", content: finalMessage });

      const response = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: this.chatHistory,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const assistantResponse = response.choices[0]?.message?.content || "No pude generar una respuesta.";

      this.chatHistory.push({ role: "assistant", content: assistantResponse });

      if (this.chatHistory.length > 12) {
        const systemMessage = this.chatHistory[0];
        const recentMessages = this.chatHistory.slice(-11);
        this.chatHistory = [systemMessage, ...recentMessages];
      }

      return this.formatResponse(assistantResponse);

    } catch (error: any) {
      console.error('❌ Error con OpenAI:', error);
      
      if (error.status === 401 || error.code === 'invalid_api_key') {
        this.useFallback = true;
      }
      
      return this.getFallbackResponse(message, userContext);
    }
  }

  getServiceStatus(): { 
    available: boolean; 
    mode: 'openai' | 'fallback'; 
    hasApiKey: boolean;
    details: string;
  } {
    return {
      available: !this.useFallback,
      mode: this.useFallback ? 'fallback' : 'openai',
      hasApiKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      details: `useFallback: ${this.useFallback}, hasApiKey: ${!!process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
    };
  }

  resetChat(): void {
    this.chatHistory = [];
    this.isInitialized = false;
    this.lastImageHash = null;
    this.conversationContext = {
      lastMentionedMateria: null,
      lastQueryType: null,
      pendingAction: null,
      pendingTopicSelection: null
    };
  }

  getChatHistory(): any[] {
    return this.chatHistory;
  }
}

// ===== TIPOS PARA EL SISTEMA DE VOZ Y CONTEXTO =====

type VoiceIntentType = 
  | 'CONSULTA_CALIFICACIONES'
  | 'CONSULTA_MATERIAS' 
  | 'CONSULTA_AULA'
  | 'MEJOR_NOTA'
  | 'PEOR_NOTA'
  | 'PLAN_MEJORA'
  | 'CONSULTA_ESPECIFICA'
  | 'SALUDO'
  | 'OTRO';

interface VoiceIntent {
  type: VoiceIntentType;
  transcription: string;
  confidence: number;
  entities: VoiceEntities;
}

interface VoiceEntities {
  materias: string[];
  acciones: string[];
  parametros: string[];
}

interface MateriaSyllabus {
  materiaNombre: string;
  paraleloId: number | null;
  temas: SyllabusTema[];
}

interface SyllabusTema {
  id: number | null;
  titulo: string;
  descripcion?: string | null;
  semana?: number | null;
  orden?: number | null;
  subtemas: SyllabusSubtema[];
}

interface SyllabusSubtema {
  id: number | null;
  titulo: string;
  descripcion?: string | null;
  recursos?: string | null;
  orden?: number | null;
}

interface TopicSelectionSubtopic {
  id: number | null;
  titulo: string;
  descripcion?: string | null;
}

interface TopicSelectionOption {
  id: string;
  materia: string;
  tema: string;
  temaDescripcion?: string | null;
  subtemas: TopicSelectionSubtopic[];
}

interface TopicSelectionState {
  options: TopicSelectionOption[];
  source: 'roadmap' | 'syllabus';
  prompt: string;
}

interface TopicSelectionPreparation {
  state: TopicSelectionState;
  message: string;
}

interface AcademicResponseOptions {
  syllabusData?: MateriaSyllabus[] | null;
  requestedSyllabus?: boolean;
}

interface ConversationContext {
  lastMentionedMateria: string | null;
  lastQueryType: string | null;
  pendingAction: string | null;
  pendingTopicSelection: TopicSelectionState | null;
}

export const chatbotService = new ChatbotService();