from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password

# Create your views here.
class EstudianteViewSet(viewsets.ModelViewSet):
    queryset = Estudiante.objects.all()
    serializer_class = EstudianteSerializer

class RegisterEstudianteView(generics.CreateAPIView):
    queryset = Estudiante.objects.all()
    serializer_class = RegisterEstudianteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        estudiante = serializer.save()

        # Generate JWT automatically
        refresh = RefreshToken.for_user(estudiante)
        return Response({
            "message": "Estudiante registrado exitosamente",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "nombre": estudiante.nombre,
            "cedula": estudiante.cedula
        }, status=status.HTTP_201_CREATED)

class PerfilEstudianteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = PerfilEstudianteSerializer(request.user)
        return Response(serializer.data)

class CambiarPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        estudiante = request.user
        
        # Asegurar que request.data es un diccionario
        data = request.data if isinstance(request.data, dict) else {}
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Validar que todos los campos estén presentes
        if not current_password or not new_password or not confirm_password:
            return Response(
                {'detail': 'Todos los campos son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar contraseña actual
        if not check_password(current_password, estudiante.password):
            return Response(
                {'detail': 'La contraseña actual es incorrecta'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que las nuevas contraseñas coincidan
        if new_password != confirm_password:
            return Response(
                {'detail': 'Las contraseñas no coinciden'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar longitud de la nueva contraseña
        if len(new_password) < 6:
            return Response(
                {'detail': 'La contraseña debe tener al menos 6 caracteres'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar la contraseña
        estudiante.set_password(new_password)
        estudiante.save()
        
        return Response(
            {'detail': 'Contraseña actualizada exitosamente'}, 
            status=status.HTTP_200_OK
        )

class CarreraViewSet(viewsets.ModelViewSet):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer
    
class InscripcionViewSet(viewsets.ModelViewSet):
    queryset = Inscripcion.objects.all()
    serializer_class = InscripcionSerializer

class MisInscripcionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inscripciones = Inscripcion.objects.filter(
            id_Estudiante=request.user,
            estado=True
        ).select_related('id_Carrera', 'id_Paralelo')
        
        serializer = InscripcionDetalleSerializer(inscripciones, many=True)
        return Response(serializer.data)
    
class NivelViewSet(viewsets.ModelViewSet):
    queryset = Nivel.objects.all()
    serializer_class = NivelSerializer
    
class ParaleloViewSet(viewsets.ModelViewSet):
    queryset = Paralelo.objects.all()
    serializer_class = ParaleloSerializer
    
class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer

class PeriodoAcademicoViewSet(viewsets.ModelViewSet):
    queryset = PeriodoAcademico.objects.all()
    serializer_class = PeriodoAcademicoSerializer


class SilaboViewSet(viewsets.ModelViewSet):
    queryset = Silabo.objects.select_related('id_Materia', 'periodo', 'id_Paralelo').prefetch_related('temas__subtemas')
    serializer_class = SilaboSerializer


class TemaViewSet(viewsets.ModelViewSet):
    queryset = Tema.objects.select_related('id_Silabo').prefetch_related('subtemas')
    serializer_class = TemaSerializer


class SubtemaViewSet(viewsets.ModelViewSet):
    queryset = Subtema.objects.select_related('id_Tema')
    serializer_class = SubtemaSerializer

