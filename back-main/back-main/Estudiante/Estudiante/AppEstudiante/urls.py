from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import *

router = DefaultRouter()
router.register(r'estudiante', EstudianteViewSet, basename='estudiante')
router.register(r'carrera', CarreraViewSet, basename='carrera')
router.register(r'inscripcion', InscripcionViewSet, basename='inscripcion')
router.register(r'nivel', NivelViewSet, basename='nivel')
router.register(r'paralelo', ParaleloViewSet, basename='paralelo')
router.register(r'materia', MateriaViewSet, basename='materia')
router.register(r'periodo-academico', PeriodoAcademicoViewSet, basename='periodo-academico')
router.register(r'silabo', SilaboViewSet, basename='silabo')
router.register(r'tema', TemaViewSet, basename='tema')
router.register(r'subtema', SubtemaViewSet, basename='subtema')

urlpatterns = [
    path('register/', RegisterEstudianteView.as_view(), name='register_estudiante'),
    path('perfil/', PerfilEstudianteView.as_view(), name='perfil-estudiante'),
    path('mis-inscripciones/', MisInscripcionesView.as_view(), name='mis-inscripciones'),
    path('cambiar-password/', CambiarPasswordView.as_view(), name='cambiar-password'),
]

urlpatterns += router.urls

