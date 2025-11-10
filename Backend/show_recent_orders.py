from ABMC_db import obtener_ordenes

def main():
    # obtener las últimas 10 órdenes en modo summary
    ordenes = obtener_ordenes(mode='summary') or []
    print('Últimas órdenes (nroDeOrden -> estado):')
    for o in ordenes[:20]:
        print(f"{o.get('nroDeOrden')} -> estado={o.get('estado')} resultado={o.get('resultado')}")

if __name__ == '__main__':
    main()
