from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Estudiante, Carrera, Inscripcion, Nivel, Materia, Paralelo

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