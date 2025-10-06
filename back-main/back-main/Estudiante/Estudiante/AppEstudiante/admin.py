from django.contrib import admin
from .models import Estudiante, Carrera, Inscripcion, Nivel, Materia, Paralelo

# Register your models here.
admin.site.register(Estudiante)
admin.site.register(Carrera)
admin.site.register(Inscripcion)
admin.site.register(Nivel)
admin.site.register(Materia)
admin.site.register(Paralelo)

# apps/academico/admin.py
from django.contrib import admin
from .models import PeriodoAcademico, Silabo, Tema, Subtema

class SubtemaInline(admin.TabularInline):
    model = Subtema
    extra = 1

class TemaInline(admin.StackedInline):
    model = Tema
    extra = 1

@admin.register(Silabo)
class SilaboAdmin(admin.ModelAdmin):
    list_display = ("id_Materia", "periodo", "id_Paralelo", "estado", "actualizado_en")
    list_filter = ("periodo", "estado", "id_Materia")
    search_fields = ("id_Materia__nombre", "periodo__codigo")
    inlines = [TemaInline]

@admin.register(Tema)
class TemaAdmin(admin.ModelAdmin):
    list_display = ("id_Silabo", "orden", "titulo", "semana")
    list_filter = ("id_Silabo__periodo",)
    inlines = [SubtemaInline]

admin.site.register(PeriodoAcademico)
admin.site.register(Subtema)
