from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Estudiante, Carrera, Inscripcion, Nivel, Materia, Paralelo, PeriodoAcademico, Silabo, Tema, Subtema

# ===== PRIMERO: Serializers básicos =====
class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = ['id_Estudiante', 'nombre', 'cedula', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

        
class RegisterEstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = ['nombre', 'cedula', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        estudiante = Estudiante.objects.create_user(
            nombre=validated_data['nombre'],
            cedula=validated_data['cedula'],
            password=validated_data['password']
        )
        return estudiante


class PerfilEstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = ['id_Estudiante', 'nombre', 'cedula']


class CarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrera
        exclude = ['estado']


class NivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nivel
        exclude = ['estado']


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        exclude = ['estado']


# ===== NUEVO: Serializer de Paralelo que incluye Materia =====
class ParaleloDetalleSerializer(serializers.ModelSerializer):
    materia = MateriaSerializer(source='id_Materia', read_only=True)
    
    
    class Meta:
        model = Paralelo
        fields = ['id_Paralelo', 'id_Materia', 'materia', 'numero_paralelo', 'cupo_maximo', 'aula']


# ===== Serializer básico de Paralelo (sin materia) =====
class ParaleloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paralelo
        exclude = ['estado']


class InscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inscripcion
        exclude = ['fecha_inscripcion', 'estado']


# ===== MODIFICADO: InscripcionDetalleSerializer con ParaleloDetalleSerializer =====
class InscripcionDetalleSerializer(serializers.ModelSerializer):
    carrera = CarreraSerializer(source='id_Carrera', read_only=True)
    paralelo = ParaleloDetalleSerializer(source='id_Paralelo', read_only=True)  # ← Cambiado aquí
    
    class Meta:
        model = Inscripcion
        fields = ['id_Inscripcion', 'carrera', 'paralelo', 'calificacion', 'fecha_inscripcion']
class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoAcademico
        fields = ['id', 'codigo', 'fecha_inicio', 'fecha_fin', 'activo']


class SubtemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtema
        fields = ['id', 'id_Tema', 'titulo', 'descripcion', 'recursos', 'orden']


class TemaSerializer(serializers.ModelSerializer):
    subtemas = SubtemaSerializer(many=True, read_only=True)
    silabo = serializers.PrimaryKeyRelatedField(source='id_Silabo', read_only=True)

    class Meta:
        model = Tema
        fields = ['id', 'silabo', 'id_Silabo', 'titulo', 'descripcion', 'semana', 'orden', 'subtemas']
        extra_kwargs = {'id_Silabo': {'write_only': False}}


class SilaboSerializer(serializers.ModelSerializer):
    materia = MateriaSerializer(source='id_Materia', read_only=True)
    paralelo = ParaleloSerializer(source='id_Paralelo', read_only=True)
    periodo_detalle = PeriodoAcademicoSerializer(source='periodo', read_only=True)
    temas = TemaSerializer(many=True, read_only=True)

    class Meta:
        model = Silabo
        fields = [
            'id',
            'id_Materia',
            'id_Paralelo',
            'periodo',
            'titulo',
            'descripcion',
            'estado',
            'creado_en',
            'actualizado_en',
            'materia',
            'paralelo',
            'periodo_detalle',
            'temas',
        ]
        read_only_fields = ['creado_en', 'actualizado_en']
