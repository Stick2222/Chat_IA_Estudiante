from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class EstudianteManager(BaseUserManager):
    def create_user(self, nombre, cedula, password=None, **extra_fields):
        if not nombre:
            raise ValueError('El nombre es obligatorio')
        if not cedula:
            raise ValueError('La cédula es obligatoria')
        user = self.model(nombre=nombre, cedula=cedula, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, nombre, cedula, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(nombre, cedula, password, **extra_fields)


class Estudiante(AbstractBaseUser, PermissionsMixin):
    id_Estudiante = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    cedula = models.CharField(max_length=10, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    # Importante: solucionamos los conflictos de related_name
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='estudiantes',  # antes era user_set, ahora es distinto
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='estudiantes_perms',  # distinto al user_set de auth.User
        blank=True
    )

    USERNAME_FIELD = 'nombre'
    REQUIRED_FIELDS = ['cedula']

    objects = EstudianteManager()

    @property
    def id(self):
        return self.id_Estudiante

# Los demás modelos permanecen igual
class Carrera(models.Model):
    id_Carrera= models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, blank=False, null=False)
    duracion_semestre= models.IntegerField(blank=False, null=False)
    estado= models.BooleanField(blank=False, null=False, default=True)
    def __str__(self):
        return self.nombre 

class Nivel(models.Model):
    id_Nivel= models.AutoField(primary_key=True)
    id_Carrera= models.ForeignKey(Carrera, on_delete=models.CASCADE, blank=False, null=False)
    numero_nivel = models.IntegerField(blank=False, null=False)
    estado= models.BooleanField(blank=False, null=False, default=True)
    def __str__(self):
        return f"Nivel {self.numero_nivel} - {self.id_Carrera.nombre}"

class Materia(models.Model):
    id_Materia= models.AutoField(primary_key=True)
    id_Nivel= models.ForeignKey(Nivel, on_delete=models.CASCADE, blank=False, null=False)
    nombre = models.CharField(max_length=100, blank=False, null=False)
    creditos = models.IntegerField(blank=False, null=False)
    horas_semana = models.IntegerField(blank=False, null=False)
    tipo= models.CharField(max_length=100, blank=False, null=False)
    estado= models.BooleanField(blank=False, null=False, default=True)
    def __str__(self):
        return self.nombre 

class Paralelo(models.Model):
    id_Paralelo= models.AutoField(primary_key=True)
    id_Materia= models.ForeignKey(Materia, on_delete=models.CASCADE, blank=False, null=False)
    numero_paralelo = models.IntegerField(blank=False, null=False)
    cupo_maximo = models.IntegerField(blank=False, null=False)
    aula= models.CharField(max_length=100, blank=False, null=False)
    estado= models.BooleanField(blank=False, null=False, default=True)
    def __str__(self):
        return self.aula 

class Inscripcion(models.Model):
    id_Inscripcion= models.AutoField(primary_key=True)
    id_Estudiante= models.ForeignKey(Estudiante, on_delete=models.CASCADE, blank=False, null=False)
    id_Paralelo= models.ForeignKey(Paralelo, on_delete=models.CASCADE, blank=False, null=False)
    id_Carrera= models.ForeignKey(Carrera, on_delete=models.CASCADE, blank=False, null=False)
    fecha_inscripcion= models.DateField(blank=False, null=False, auto_now_add=True)
    calificacion= models.FloatField(blank=False, null=False)
    estado= models.BooleanField(blank=False, null=False, default=True)
    def __str__(self):
        return f"Inscripción de {self.id_Estudiante.nombre} en {self.id_Carrera.nombre} - Nota: {self.calificacion}"
