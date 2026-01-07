from django.urls import path, include

from . import views

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('cadastro-pf/', views.cadastro_pf, name='cadastro_pf'),
    path('cadastro-pj/', views.cadastro_pj, name='cadastro_pj'),
    path('listar-pf/', views.listar_pf, name='listar_pf'),
    path('listar-pj/', views.listar_pj, name='listar_pj'),
    path('fotos/', views.fotos, name='fotos'),
    path('arvore/', views.arvore, name='arvore'),
    path('debug-api/', views.debug_api, name='debug_api'),

    # API
    path('api/registro/', views.RegistroView.as_view(), name='registro'),
    path('api/login/', views.LoginView.as_view(), name='api_login'),
    path('api/logout/', views.LogoutView.as_view(), name='api_logout'),
    path('api/perfil/', views.PerfilView.as_view(), name='api_perfil'),
    path('api/verify-token/', views.VerifyTokenView.as_view(), name='verify_token'),
    path('api/', include('core.api.urls')),
]