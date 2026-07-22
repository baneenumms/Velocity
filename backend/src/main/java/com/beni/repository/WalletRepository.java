package com.beni.repository;

import com.beni.entity.Driver;
import com.beni.entity.Wallet;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class WalletRepository implements PanacheRepository<Wallet> {

    public Wallet findByDriver(Driver driver) {
        return find("driver", driver).firstResult();
    }
}