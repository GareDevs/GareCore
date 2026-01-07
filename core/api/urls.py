from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.api.views.pessoa import PessoaFisicaViewSet, PessoaJuridicaViewSet
from core.api.views.foto import FotoViewSet
from core.api.views.relacionamento import RelacionamentoViewSet
from core.api.views.dashboard import DashboardStatsAPIView, DashboardSearchAPIView
from core.api.debug import DebugAPIView

# Criar router
router = DefaultRouter()
router.register(r'pessoas-fisicas', PessoaFisicaViewSet, basename='pessoa-fisica')
router.register(r'pessoas-juridicas', PessoaJuridicaViewSet, basename='pessoa-juridica')
router.register(r'fotos', FotoViewSet, basename='foto')
router.register(r'relacionamentos', RelacionamentoViewSet, basename='relacionamento')

# Incluir rotas
urlpatterns = [
    path('debug/', DebugAPIView.as_view(), name='debug-api'),
    path('dashboard/stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('dashboard/search/', DashboardSearchAPIView.as_view(), name='dashboard-search'),
    path('', include(router.urls)),
]
