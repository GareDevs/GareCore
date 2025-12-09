from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('cadastro-pf/', views.cadastro_pf, name='cadastro_pf'),
    path('cadastro-pj/', views.cadastro_pj, name='cadastro_pj'),
    path('listar-pf/', views.listar_pf, name='listar_pf'),
    path('listar-pj/', views.listar_pj, name='listar_pj'),
    path('fotos/', views.fotos, name='fotos'),
    path('arvore/', views.arvore, name='arvore'),

    # API
    path('api/registro/', views.RegistroView.as_view(), name='registro'),
    path('api/login/', views.LoginView.as_view(), name='api_login'),
    path('api/logout/', views.LogoutView.as_view(), name='api_logout'),
    path('api/perfil/', views.PerfilView.as_view(), name='api_perfil'),
    path('api/', include(router.urls)),
]