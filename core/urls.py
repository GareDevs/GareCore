from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'pessoa-fisica', views.PessoaFisicaViewSet)
router.register(r'pessoa-juridica', views.PessoaJuridicaViewSet)
router.register(r'enderecos', views.EnderecoViewSet)
router.register(r'contatos-empresa', views.ContatoEmpresaViewSet)
router.register(r'socios-empresa', views.SocioEmpresaViewSet)
router.register(r'relacionamentos', views.RelacionamentoViewSet)
router.register(r'fotos', views.FotoViewSet)

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
    path('api/verify-token/', views.VerifyTokenView.as_view(), name='verify_token'),
    path('api/', include(router.urls)),
]