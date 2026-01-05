from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.api.views.pessoa import PessoaFisicaViewSet, PessoaJuridicaViewSet
from core.api.views.foto import FotoViewSet
from core.api.views.relacionamento import RelacionamentoViewSet

# Criar router
router = DefaultRouter()
router.register(r'pessoas-fisicas', PessoaFisicaViewSet, basename='pessoa-fisica')
router.register(r'pessoas-juridicas', PessoaJuridicaViewSet, basename='pessoa-juridica')
router.register(r'fotos', FotoViewSet, basename='foto')
router.register(r'relacionamentos', RelacionamentoViewSet, basename='relacionamento')

# Incluir rotas
urlpatterns = [
    path('', include(router.urls)),
]
