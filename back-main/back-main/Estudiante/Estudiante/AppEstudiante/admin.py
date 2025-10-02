from django.contrib import admin
from .models import Estudiante, Carrera, Inscripcion, Nivel, Materia, Paralelo

# Register your models here.
admin.site.register(Estudiante)
admin.site.register(Carrera)
admin.site.register(Inscripcion)
admin.site.register(Nivel)
admin.site.register(Materia)
admin.site.register(Paralelo)
