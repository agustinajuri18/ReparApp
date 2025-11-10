from ABMC_db import mostrar_estados

def main():
    estados = mostrar_estados() or []
    print('Estados en la base de datos:')
    for e in estados:
        print('-', getattr(e, 'idEstado', None), '->', repr(getattr(e, 'nombre', None)))

if __name__ == '__main__':
    main()
