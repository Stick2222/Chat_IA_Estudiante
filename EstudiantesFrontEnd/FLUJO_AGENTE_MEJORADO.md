# Flujo del Agente EduBot Mejorado

## Nuevo Flujo de Selección de Temas

### 1. Usuario solicita ayuda con una materia
```
Usuario: "Necesito ayuda con Cálculo Integral"
```

### 2. Agente obtiene el silabo de la materia
```
🤖 EduBot ejecuta: obtener_silabo_materia("Cálculo Integral")
📋 Resultado: Lista completa de temas y subtemas del silabo
```

### 3. Agente presenta opciones al estudiante
```
🤖 EduBot: "He encontrado el silabo de Cálculo Integral. Los temas disponibles son:

1. Integrales definidas
   - Método de sustitución
   - Regla de partes

2. Aplicaciones de integrales
   - Volumen por discos
   - Trabajo y energía

¿Qué tema específico te gustaría reforzar?"
```

### 4. Usuario selecciona un tema
```
Usuario: "Quiero reforzar el tema de Integrales definidas"
```

### 5. Agente busca recursos específicos
```
🤖 EduBot ejecuta: buscar_recursos_estudio(
  materia: "Cálculo Integral",
  tema_especifico: "Integrales definidas"
)
```

### 6. Agente presenta recursos personalizados
```
🤖 EduBot: "Perfecto! He encontrado recursos específicos para 'Integrales definidas':

📺 YouTube: Videos sobre integrales definidas en Cálculo Integral
🎓 Khan Academy: Cursos interactivos de integrales definidas
📚 Coursera: Cursos universitarios de Cálculo Integral
🔬 MIT OpenCourseWare: Material avanzado sobre integrales definidas
📝 Ejercicios: Problemas resueltos paso a paso
```

## Características del Nuevo Sistema

### ✅ Funcionalidades Agregadas
- **Consulta de silabo**: Obtiene temas y subtemas desde la base de datos
- **Selección interactiva**: Permite al estudiante elegir tema específico
- **Recursos personalizados**: Búsquedas específicas por tema y subtema
- **Flujo inteligente**: Auto-detecta materias críticas y sugiere temas

### 🔧 Funciones del Agente
1. **obtener_calificaciones**: Consulta notas del estudiante
2. **obtener_silabo_materia**: Obtiene silabo completo con temas/subtemas
3. **buscar_recursos_estudio**: Busca recursos específicos por tema

### 🎯 Casos de Uso
- **Materia con nota baja**: Auto-obtiene silabo y sugiere temas para reforzar
- **Solicitud específica**: Usuario pide ayuda → Silabo → Selección → Recursos
- **Consulta general**: Usuario pregunta sobre materia → Silabo → Opciones

### 📊 Ventajas del Nuevo Sistema
- **Más preciso**: Recursos específicos para temas concretos
- **Interactivo**: El estudiante participa en la selección
- **Contextual**: Usa datos reales del silabo de la universidad
- **Personalizado**: Adapta recursos según el tema elegido
