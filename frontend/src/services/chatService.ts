// // services/chatService.ts
// import api from '../api/api';

// export interface ChatResponse {
//   response: string;
//   data?: any;
//   type: 'text' | 'data' | 'error';
// }

// class ChatService {
//   private processMessageType(message: string): string {
//     // Detectar tipo de consulta basado en palabras clave
//     const lowerMessage = message.toLowerCase();
    
//     if (lowerMessage.includes('calificación') || lowerMessage.includes('nota')) {
//       return 'grades';
//     } else if (lowerMessage.includes('materia') || lowerMessage.includes('curso')) {
//       return 'courses';
//     } else if (lowerMessage.includes('horario') || lowerMessage.includes('clase')) {
//       return 'schedule';
//     } else if (lowerMessage.includes('profesor') || lowerMessage.includes('docente')) {
//       return 'teachers';
//     } else {
//       return 'general';
//     }
//   }

//   async sendMessage(
//     message: string, 
//     file?: File, 
//     fileType?: 'image' | 'audio'
//   ): Promise<ChatResponse> {
//     try {
//       const messageType = this.processMessageType(message);
      
//       // Si hay archivo, procesarlo primero
//       if (file) {
//         const formData = new FormData();
//         formData.append('message', message);
//         formData.append('file', file);
//         formData.append('file_type', fileType || 'image');
        
//         const response = await api.post('/chat/with-file', formData, {
//           headers: { 'Content-Type': 'multipart/form-data' }
//         });
        
//         return response.data;
//       }

//       // Consulta basada en el tipo de mensaje
//       switch (messageType) {
//         case 'grades':
//           const grades = await this.getStudentGrades();
//           return {
//             response: `Tus calificaciones son:\n${grades.map(g => `${g.materia}: ${g.calificacion}`).join('\n')}`,
//             data: grades,
//             type: 'data'
//           };
          
//         case 'courses':
//           const courses = await this.getStudentCourses();
//           return {
//             response: `Estás registrado en:\n${courses.map(c => `• ${c.nombre}`).join('\n')}`,
//             data: courses,
//             type: 'data'
//           };
          
//         case 'schedule':
//           const schedule = await this.getStudentSchedule();
//           return {
//             response: `Tu horario es:\n${schedule.map(s => `${s.dia}: ${s.hora} - ${s.materia}`).join('\n')}`,
//             data: schedule,
//             type: 'data'
//           };
          
//         default:
//           // Usar IA para respuestas generales
//           return await this.getAIResponse(message);
//       }
//     } catch (error) {
//       console.error('Error en chat service:', error);
//       return {
//         response: 'Lo siento, hubo un error procesando tu mensaje. Intenta de nuevo.',
//         type: 'error'
//       };
//     }
//   }

//   private async getStudentGrades() {
//     const response = await api.get('/estudiante/calificaciones');
//     return response.data;
//   }

//   private async getStudentCourses() {
//     const response = await api.get('/estudiante/materias');
//     return response.data;
//   }

//   private async getStudentSchedule() {
//     const response = await api.get('/estudiante/horario');
//     return response.data;
//   }

//   private async getAIResponse(message: string): Promise<ChatResponse> {
//     // Integración con OpenAI, Gemini, o tu modelo preferido
//     try {
//       const response = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`
//         },
//         body: JSON.stringify({
//           model: 'gpt-3.5-turbo',
//           messages: [
//             {
//               role: 'system',
//               content: 'Eres un asistente académico útil para estudiantes. Responde en español.'
//             },
//             {
//               role: 'user',
//               content: message
//             }
//           ],
//           max_tokens: 500
//         })
//       });

//       const data = await response.json();
//       return {
//         response: data.choices[0].message.content,
//         type: 'text'
//       };
//     } catch (error) {
//       // Fallback a respuestas predefinidas
//       return this.getFallbackResponse(message);
//     }
//   }

//   private getFallbackResponse(message: string): ChatResponse {
//     const lowerMessage = message.toLowerCase();
    
//     if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días')) {
//       return { response: '¡Hola! Soy tu asistente académico. ¿En qué puedo ayudarte?', type: 'text' };
//     } else if (lowerMessage.includes('gracias')) {
//       return { response: '¡De nada! ¿Hay algo más en lo que pueda ayudarte?', type: 'text' };
//     } else {
//       return { 
//         response: 'Puedo ayudarte con:\n• Tus calificaciones\n• Materias inscritas\n• Horarios de clase\n• Información de profesores\n\n¿Sobre qué quieres consultar?', 
//         type: 'text' 
//       };
//     }
//   }
// }

// export const chatService = new ChatService();