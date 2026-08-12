package com.beni.repository;

import com.beni.entity.PaymentMethod;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PaymentMethodRepository
        implements PanacheRepository<PaymentMethod> {

    public PaymentMethod findByCode(
            String code
    ) {
        if (
                code == null ||
                        code.isBlank()
        ) {
            return null;
        }

        return find(
                "paymentMethodCode",
                code.trim().toUpperCase()
        ).firstResult();
    }

    public List<PaymentMethod>
    listAvailableTopUpMethods() {
        return list(
                "canTopUp = true " +
                        "and active = true " +
                        "order by displayName"
        );
    }

    public PaymentMethod
    findActiveTopUpMethod(
            String code
    ) {
        if (
                code == null ||
                        code.isBlank()
        ) {
            return null;
        }

        return find(
                "paymentMethodCode = ?1 " +
                        "and canTopUp = true " +
                        "and active = true",
                code.trim().toUpperCase()
        ).firstResult();
    }
}