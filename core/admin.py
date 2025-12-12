from django.contrib import admin
from .models import Usuario,Pessoa,PessoaFisica,PessoaJuridica, Endereco, ContatoEmpresa, SocioEmpresa

admin.site.register(Usuario)
admin.site.register(Pessoa)
admin.site.register(PessoaFisica)
admin.site.register(PessoaJuridica)
admin.site.register(Endereco)
admin.site.register(ContatoEmpresa)
admin.site.register(SocioEmpresa)

